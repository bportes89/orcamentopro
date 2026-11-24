import { and, eq, gte, isNull, lt } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { create } from "zustand";

import { orcamentos, subscriptions } from "@/db/schema";
import { db } from "@/db/sqlite";
import { supabase } from "@/services/supabase";

export const LIMITE_GRATUITO = 5;

type StatusAssinatura = NonNullable<
  typeof subscriptions.$inferInsert["status"]
>;
type PlanoAssinatura = NonNullable<typeof subscriptions.$inferInsert["plan"]>;

export type AssinaturaLocal = typeof subscriptions.$inferSelect;

export type EstadoAssinatura = {
  isPro: boolean;
  orcamentosRestantes: number;
  totalNoMes: number;
  plano: PlanoAssinatura;
  status: StatusAssinatura;
  expiresAt: string | null;
};

type AssinaturaRemota = {
  status?: string | null;
  plan?: string | null;
  expires_at?: string | null;
  platform?: string | null;
  original_transaction_id?: string | null;
};

type CacheState = {
  versao: number;
  incrementar: () => void;
};

export const useAssinaturaCache = create<CacheState>((set) => ({
  versao: 0,
  incrementar: () => set((state) => ({ versao: state.versao + 1 })),
}));

export function notificarAssinaturaAlterada(): void {
  useAssinaturaCache.getState().incrementar();
}

export class LimiteOrcamentosAtingidoError extends Error {
  constructor() {
    super("Você atingiu o limite de orçamentos do plano gratuito.");
    this.name = "LimiteOrcamentosAtingidoError";
  }
}

export class QuotaRejectedError extends Error {
  constructor() {
    super("O servidor não permitiu criar mais orçamentos neste mês.");
    this.name = "QuotaRejectedError";
  }
}

const STATUS_VALIDOS: StatusAssinatura[] = [
  "inactive",
  "active",
  "trialing",
  "grace_period",
  "billing_issue",
  "canceled",
  "expired",
];

function limitesDoMes(): { inicio: string; fim: string } {
  const agora = new Date();

  return {
    inicio: new Date(
      Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1),
    ).toISOString(),
    fim: new Date(
      Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + 1, 1),
    ).toISOString(),
  };
}

export function contarOrcamentosDoMes(userId: string): number {
  const { inicio, fim } = limitesDoMes();
  const resultado = db
    .select({ id: orcamentos.id })
    .from(orcamentos)
    .where(
      and(
        eq(orcamentos.userId, userId),
        isNull(orcamentos.deletedAt),
        gte(orcamentos.createdAt, inicio),
        lt(orcamentos.createdAt, fim),
      ),
    )
    .all();

  return resultado.length;
}

export function obterAssinaturaLocal(userId: string): AssinaturaLocal | null {
  return (
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)
      .get() ?? null
  );
}

function normalizarStatus(valor: string | null | undefined): StatusAssinatura {
  return STATUS_VALIDOS.includes(valor as StatusAssinatura)
    ? (valor as StatusAssinatura)
    : "inactive";
}

function normalizarPlano(valor: string | null | undefined): PlanoAssinatura {
  return valor === "pro" ? "pro" : "free";
}

export function salvarAssinaturaLocal(
  userId: string,
  remota: AssinaturaRemota | null,
): AssinaturaLocal {
  const valores = {
    userId,
    status: normalizarStatus(remota?.status),
    plan: normalizarPlano(remota?.plan),
    expiresAt: remota?.expires_at ?? null,
    platform: remota?.platform ?? null,
    originalTransactionId: remota?.original_transaction_id ?? null,
    updatedAt: new Date().toISOString(),
  };

  db.insert(subscriptions)
    .values(valores)
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        status: valores.status,
        plan: valores.plan,
        expiresAt: valores.expiresAt,
        platform: valores.platform,
        originalTransactionId: valores.originalTransactionId,
        updatedAt: valores.updatedAt,
      },
    })
    .run();

  return obterAssinaturaLocal(userId) ?? { ...valores };
}

const STATUS_COM_ACESSO: StatusAssinatura[] = [
  "active",
  "trialing",
  "grace_period",
  "canceled",
];

export function assinaturaEstaAtiva(
  assinatura: AssinaturaLocal | null,
): boolean {
  if (!assinatura || assinatura.plan !== "pro") {
    return false;
  }

  if (!STATUS_COM_ACESSO.includes(assinatura.status)) {
    return false;
  }

  if (!assinatura.expiresAt) {
    return assinatura.status !== "canceled";
  }

  return Date.parse(assinatura.expiresAt) > Date.now();
}

export function obterEstadoAssinatura(userId: string): EstadoAssinatura {
  const assinatura = obterAssinaturaLocal(userId);
  const totalNoMes = contarOrcamentosDoMes(userId);
  const isPro = assinaturaEstaAtiva(assinatura);

  return {
    isPro,
    orcamentosRestantes: isPro
      ? Number.POSITIVE_INFINITY
      : Math.max(0, LIMITE_GRATUITO - totalNoMes),
    totalNoMes,
    plano: assinatura?.plan ?? "free",
    status: assinatura?.status ?? "inactive",
    expiresAt: assinatura?.expiresAt ?? null,
  };
}

export function podeCriarOrcamentoLocal(userId: string): boolean {
  const estado = obterEstadoAssinatura(userId);
  return estado.isPro || estado.orcamentosRestantes > 0;
}

export function assertPodeCriarOrcamento(userId: string): void {
  if (!podeCriarOrcamentoLocal(userId)) {
    throw new LimiteOrcamentosAtingidoError();
  }
}

export async function sincronizarAssinatura(userId: string): Promise<void> {
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  salvarAssinaturaLocal(userId, (data as AssinaturaRemota | null) ?? null);
  notificarAssinaturaAlterada();
}

export async function assertQuotaRemota(userId: string): Promise<void> {
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client.rpc("pode_criar_orcamento", {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  if (data !== true) {
    throw new QuotaRejectedError();
  }
}
