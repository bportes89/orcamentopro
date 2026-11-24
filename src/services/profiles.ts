import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

import { profiles } from "@/db/schema";
import { db } from "@/db/sqlite";
import { withOutbox } from "@/db/sync/outbox";
import { supabase } from "@/services/supabase";

export type LocalProfile = typeof profiles.$inferSelect;

export type CreateProfileParams = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
};

export type SaveProfileParams = {
  nome: string;
  telefone: string;
  chavePix: string;
  oficio?: string | null;
};

type PerfilCache = {
  versao: number;
  incrementar: () => void;
};

export const usePerfilCache = create<PerfilCache>((set) => ({
  versao: 0,
  incrementar: () => set((state) => ({ versao: state.versao + 1 })),
}));

export function notificarPerfilAlterado(): void {
  usePerfilCache.getState().incrementar();
}

export async function createProfile({
  id,
  nome,
  email,
  telefone,
}: CreateProfileParams): Promise<void> {
  const { error } = await supabase.from("profiles").insert({
    id,
    nome,
    email,
    telefone: telefone?.trim() || null,
  });

  if (error) {
    throw new Error("Não foi possível salvar seu perfil. Tente novamente.");
  }
}

function getMetadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getLocalProfile(id: string): LocalProfile | null {
  return db.select().from(profiles).where(eq(profiles.id, id)).get() ?? null;
}

export function ensureLocalProfile(user: User): LocalProfile {
  const existing = getLocalProfile(user.id);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const nome =
    getMetadataString(user, "nome") ??
    user.email?.split("@")[0] ??
    "Prestador de serviços";

  db.insert(profiles)
    .values({
      id: user.id,
      nome,
      email: user.email ?? "",
      telefone: getMetadataString(user, "telefone"),
      createdAt: user.created_at || now,
      updatedAt: user.updated_at || now,
    })
    .run();

  const created = getLocalProfile(user.id);

  if (!created) {
    throw new Error("Não foi possível carregar seu perfil.");
  }

  return created;
}

export function saveLocalProfile(id: string, data: SaveProfileParams): void {
  const existing = getLocalProfile(id);
  const now = new Date().toISOString();
  const nome = data.nome.trim();
  const telefone = data.telefone.trim() || null;
  const chavePix = data.chavePix.trim() || null;
  const oficio = data.oficio?.trim() || existing?.oficio || null;

  withOutbox(
    {
      action: "update",
      table: "profiles",
      payload: {
        id,
        nome,
        telefone,
        chave_pix: chavePix,
        oficio,
        onboarding_done: Boolean(existing?.onboardingDone ?? 0),
        updated_at: now,
      },
    },
    (tx) => {
      tx.insert(profiles)
        .values({
          id,
          nome,
          email: existing?.email ?? "",
          telefone,
          chavePix,
          oficio,
          onboardingDone: existing?.onboardingDone ?? 0,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: { nome, telefone, chavePix, oficio, updatedAt: now },
        })
        .run();
    },
  );

  notificarPerfilAlterado();
}

export function saveLocalLogoUrl(id: string, logoUrl: string): void {
  const now = new Date().toISOString();

  withOutbox(
    {
      action: "update",
      table: "profiles",
      payload: { id, logo_url: logoUrl, updated_at: now },
    },
    (tx) => {
      tx.update(profiles)
        .set({ logoUrl, updatedAt: now })
        .where(eq(profiles.id, id))
        .run();
    },
  );

  notificarPerfilAlterado();
}

export type OnboardingUpdate = {
  onboardingDone?: boolean;
  oficio?: string | null;
};

export function salvarOnboarding(id: string, dados: OnboardingUpdate): void {
  const existing = getLocalProfile(id);
  const now = new Date().toISOString();
  const onboardingDone =
    dados.onboardingDone === undefined
      ? existing?.onboardingDone ?? 0
      : dados.onboardingDone
        ? 1
        : 0;
  const oficio =
    dados.oficio === undefined
      ? existing?.oficio ?? null
      : dados.oficio?.trim() || null;

  withOutbox(
    {
      action: "update",
      table: "profiles",
      payload: {
        id,
        onboarding_done: onboardingDone === 1,
        oficio,
        updated_at: now,
      },
    },
    (tx) => {
      tx.insert(profiles)
        .values({
          id,
          nome: existing?.nome ?? "",
          email: existing?.email ?? "",
          telefone: existing?.telefone ?? null,
          chavePix: existing?.chavePix ?? null,
          logoUrl: existing?.logoUrl ?? null,
          onboardingDone,
          oficio,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: { onboardingDone, oficio, updatedAt: now },
        })
        .run();
    },
  );

  notificarPerfilAlterado();
}

export function marcarOnboardingConcluido(id: string): void {
  salvarOnboarding(id, { onboardingDone: true });
}
