import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { orcamentoItens, orcamentos } from "@/db/schema";
import { db } from "@/db/sqlite";
import { enqueue } from "@/db/sync/outbox";
import type { ValidadeOrcamento } from "@/lib/validators";
import { supabase } from "@/services/supabase";
import { assertPodeCriarOrcamento } from "@/services/subscription";
import type { StatusOrcamento } from "@/types";

export type OrcamentoItemInput = {
  id?: string;
  descricao: string;
  unidade: string | null;
  quantidade: number;
  precoUnitario: number;
};

export type CriarOrcamentoInput = {
  clienteNome: string;
  clienteTelefone: string | null;
  validadeDias: ValidadeOrcamento;
  observacoes: string | null;
  itens: OrcamentoItemInput[];
};

export type AtualizarOrcamentoInput = CriarOrcamentoInput & {
  status: StatusOrcamento;
};

export type LocalOrcamento = typeof orcamentos.$inferSelect;
export type LocalOrcamentoItem = typeof orcamentoItens.$inferSelect;

export type OrcamentoDetalhe = {
  orcamento: LocalOrcamento;
  itens: LocalOrcamentoItem[];
};

function arredondarTotal(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function calcularTotal(
  itens: { quantidade: number; precoUnitario: number }[],
): number {
  return arredondarTotal(
    itens.reduce(
      (soma, item) => soma + item.quantidade * item.precoUnitario,
      0,
    ),
  );
}

export function criarOrcamento(
  userId: string,
  input: CriarOrcamentoInput,
): LocalOrcamento {
  assertPodeCriarOrcamento(userId);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const itens = input.itens.map((item) => ({
      id: item.id ?? crypto.randomUUID(),
      orcamentoId: id,
      descricao: item.descricao.trim(),
      unidade: item.unidade?.trim() || null,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      createdAt: now,
  }));

  const total = calcularTotal(itens);

  const orcamento: LocalOrcamento = {
    id,
    userId,
    clienteNome: input.clienteNome.trim(),
    clienteEmail: null,
    clienteTelefone: input.clienteTelefone?.trim() || null,
    status: "rascunho",
    validadeDias: input.validadeDias,
    observacoes: input.observacoes?.trim() || null,
    total,
    createdAt: now,
    updatedAt: now,
    respondidoEm: null,
    enviadoEm: null,
    deletedAt: null,
  };

  db.transaction((tx) => {
    tx.insert(orcamentos).values(orcamento).run();

    enqueue(tx, "insert", "orcamentos", {
      id: orcamento.id,
      user_id: orcamento.userId,
      cliente_nome: orcamento.clienteNome,
      cliente_telefone: orcamento.clienteTelefone,
      status: orcamento.status,
      validade_dias: orcamento.validadeDias,
      observacoes: orcamento.observacoes,
      total: orcamento.total,
      respondido_em: orcamento.respondidoEm,
      enviado_em: orcamento.enviadoEm,
      created_at: orcamento.createdAt,
      updated_at: orcamento.updatedAt,
    });

    for (const item of itens) {
      tx.insert(orcamentoItens).values(item).run();

      enqueue(tx, "insert", "orcamento_itens", {
        id: item.id,
        orcamento_id: item.orcamentoId,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        created_at: item.createdAt,
      });
    }
  });

  return orcamento;
}

export function atualizarOrcamento(
  userId: string,
  id: string,
  input: AtualizarOrcamentoInput,
): OrcamentoDetalhe | null {
  const atual = db
    .select()
    .from(orcamentos)
    .where(
      and(
        eq(orcamentos.id, id),
        eq(orcamentos.userId, userId),
        isNull(orcamentos.deletedAt),
      ),
    )
    .get();

  if (!atual) {
    return null;
  }

  const now = new Date().toISOString();
  const atuaisItens = db
    .select()
    .from(orcamentoItens)
    .where(eq(orcamentoItens.orcamentoId, id))
    .all();
  const atuaisPorId = new Map(atuaisItens.map((item) => [item.id, item]));
  const itensMantidos = new Set<string>();
  const respondidoEm =
    input.status === atual.status
      ? atual.respondidoEm
      : input.status === "aprovado"
        ? now
        : null;
  const enviadoEm =
    input.status === atual.status ? atual.enviadoEm : null;

  const itens = input.itens.map((item) => {
    const existente = item.id ? atuaisPorId.get(item.id) : undefined;

    if (existente) {
      itensMantidos.add(existente.id);

      return {
        existente,
        item: {
          id: existente.id,
          descricao: item.descricao.trim(),
          unidade: item.unidade?.trim() || null,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        },
      };
    }

    const id = crypto.randomUUID();
    itensMantidos.add(id);

    return {
      existente: null,
      item: {
        id,
        descricao: item.descricao.trim(),
        unidade: item.unidade?.trim() || null,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        createdAt: now,
      },
    };
  });

  const total = calcularTotal(itens.map((entrada) => entrada.item));

  db.transaction((tx) => {
    tx.update(orcamentos)
      .set({
        clienteNome: input.clienteNome.trim(),
        clienteTelefone: input.clienteTelefone?.trim() || null,
        validadeDias: input.validadeDias,
        observacoes: input.observacoes?.trim() || null,
        status: input.status,
        total,
        respondidoEm,
        enviadoEm,
        updatedAt: now,
      })
      .where(and(eq(orcamentos.id, id), eq(orcamentos.userId, userId)))
      .run();

    enqueue(tx, "update", "orcamentos", {
      id,
      cliente_nome: input.clienteNome.trim(),
      cliente_telefone: input.clienteTelefone?.trim() || null,
      validade_dias: input.validadeDias,
      observacoes: input.observacoes?.trim() || null,
      status: input.status,
      total,
      respondido_em: respondidoEm,
      enviado_em: enviadoEm,
      updated_at: now,
    });

    for (const entrada of itens) {
      if (entrada.existente) {
        const mudou =
          entrada.existente.descricao !== entrada.item.descricao ||
          entrada.existente.unidade !== entrada.item.unidade ||
          entrada.existente.quantidade !== entrada.item.quantidade ||
          entrada.existente.precoUnitario !== entrada.item.precoUnitario;

        if (!mudou) {
          continue;
        }

        tx.update(orcamentoItens)
          .set({
            descricao: entrada.item.descricao,
            unidade: entrada.item.unidade,
            quantidade: entrada.item.quantidade,
            precoUnitario: entrada.item.precoUnitario,
          })
          .where(
            and(
              eq(orcamentoItens.id, entrada.item.id),
              eq(orcamentoItens.orcamentoId, id),
            ),
          )
          .run();

        enqueue(tx, "update", "orcamento_itens", {
          id: entrada.item.id,
          descricao: entrada.item.descricao,
          unidade: entrada.item.unidade,
          quantidade: entrada.item.quantidade,
          preco_unitario: entrada.item.precoUnitario,
        });

        continue;
      }

      tx.insert(orcamentoItens)
        .values({
          id: entrada.item.id,
          orcamentoId: id,
          descricao: entrada.item.descricao,
          unidade: entrada.item.unidade,
          quantidade: entrada.item.quantidade,
          precoUnitario: entrada.item.precoUnitario,
          createdAt: now,
        })
        .run();

      enqueue(tx, "insert", "orcamento_itens", {
        id: entrada.item.id,
        orcamento_id: id,
        descricao: entrada.item.descricao,
        unidade: entrada.item.unidade,
        quantidade: entrada.item.quantidade,
        preco_unitario: entrada.item.precoUnitario,
        created_at: now,
      });
    }

    for (const item of atuaisItens) {
      if (itensMantidos.has(item.id)) {
        continue;
      }

      tx.delete(orcamentoItens)
        .where(
          and(
            eq(orcamentoItens.id, item.id),
            eq(orcamentoItens.orcamentoId, id),
          ),
        )
        .run();

      enqueue(tx, "delete", "orcamento_itens", { id: item.id });
    }
  });

  return obterOrcamento(userId, id);
}

export function atualizarStatusOrcamento(
  userId: string,
  id: string,
  status: StatusOrcamento,
): boolean {
  const atual = db
    .select()
    .from(orcamentos)
    .where(
      and(
        eq(orcamentos.id, id),
        eq(orcamentos.userId, userId),
        isNull(orcamentos.deletedAt),
      ),
    )
    .get();

  if (!atual || atual.status === status) {
    return false;
  }

  const now = new Date().toISOString();
  const respondidoEm = status === "aprovado" ? now : null;

  db.transaction((tx) => {
    tx.update(orcamentos)
      .set({ status, respondidoEm, updatedAt: now })
      .where(and(eq(orcamentos.id, id), eq(orcamentos.userId, userId)))
      .run();

    enqueue(tx, "update", "orcamentos", {
      id,
      status,
      respondido_em: respondidoEm,
      updated_at: now,
    });
  });

  return true;
}

export function marcarOrcamentoEnviado(
  userId: string,
  id: string,
): boolean {
  const atual = db
    .select()
    .from(orcamentos)
    .where(
      and(
        eq(orcamentos.id, id),
        eq(orcamentos.userId, userId),
        isNull(orcamentos.deletedAt),
      ),
    )
    .get();

  if (!atual || atual.status !== "rascunho") {
    return false;
  }

  const now = new Date().toISOString();

  db.transaction((tx) => {
    tx.update(orcamentos)
      .set({ status: "enviado", enviadoEm: now, updatedAt: now })
      .where(and(eq(orcamentos.id, id), eq(orcamentos.userId, userId)))
      .run();

    enqueue(tx, "update", "orcamentos", {
      id,
      status: "enviado",
      enviado_em: now,
      updated_at: now,
    });
  });

  return true;
}

export function excluirOrcamento(userId: string, id: string): boolean {
  const atual = db
    .select({ id: orcamentos.id })
    .from(orcamentos)
    .where(
      and(
        eq(orcamentos.id, id),
        eq(orcamentos.userId, userId),
        isNull(orcamentos.deletedAt),
      ),
    )
    .get();

  if (!atual) {
    return false;
  }

  const now = new Date().toISOString();

  db.transaction((tx) => {
    tx.update(orcamentos)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(orcamentos.id, id), eq(orcamentos.userId, userId)))
      .run();

    enqueue(tx, "delete", "orcamentos", {
      id,
      deleted_at: now,
      updated_at: now,
    });
  });

  return true;
}

export function listarOrcamentos(userId: string): LocalOrcamento[] {
  return db
    .select()
    .from(orcamentos)
    .where(
      and(eq(orcamentos.userId, userId), isNull(orcamentos.deletedAt)),
    )
    .orderBy(desc(orcamentos.createdAt), desc(orcamentos.id))
    .all();
}

export async function sincronizarOrcamentos(
  userId: string,
): Promise<void> {
  const [orcamentosRemotos, itensRemotos] = await Promise.all([
    supabase.from("orcamentos").select("*").eq("user_id", userId),
    supabase.from("orcamento_itens").select("*"),
  ]);

  if (orcamentosRemotos.error) {
    throw orcamentosRemotos.error;
  }

  if (itensRemotos.error) {
    throw itensRemotos.error;
  }

  db.transaction((tx) => {
    for (const remoto of orcamentosRemotos.data) {
      const { id, ...campos } = {
        id: remoto.id,
        userId: remoto.user_id,
        clienteNome: remoto.cliente_nome,
        clienteEmail: remoto.cliente_email,
        clienteTelefone: remoto.cliente_telefone,
        status: remoto.status,
        validadeDias: remoto.validade_dias,
        observacoes: remoto.observacoes,
        total: Number(remoto.total),
        createdAt: remoto.created_at,
        updatedAt: remoto.updated_at,
          respondidoEm: remoto.respondido_em,
          enviadoEm: remoto.enviado_em,
          deletedAt: remoto.deleted_at,
      };

      tx.insert(orcamentos)
        .values({ id, ...campos })
        .onConflictDoUpdate({
          target: orcamentos.id,
          set: campos,
        })
        .run();
    }

    for (const remoto of itensRemotos.data) {
      const { id, ...campos } = {
        id: remoto.id,
        orcamentoId: remoto.orcamento_id,
        descricao: remoto.descricao,
        unidade: remoto.unidade ?? null,
        quantidade: Number(remoto.quantidade),
        precoUnitario: Number(remoto.preco_unitario),
        createdAt: remoto.created_at,
      };

      tx.insert(orcamentoItens)
        .values({ id, ...campos })
        .onConflictDoUpdate({
          target: orcamentoItens.id,
          set: campos,
        })
        .run();
    }
  });
}

export function obterOrcamento(
  userId: string,
  id: string,
): OrcamentoDetalhe | null {
  const orcamento = db
    .select()
    .from(orcamentos)
    .where(
      and(
        eq(orcamentos.id, id),
        eq(orcamentos.userId, userId),
        isNull(orcamentos.deletedAt),
      ),
    )
    .get();

  if (!orcamento) {
    return null;
  }

  const itens = db
    .select()
    .from(orcamentoItens)
    .where(eq(orcamentoItens.orcamentoId, id))
    .orderBy(asc(orcamentoItens.createdAt), asc(orcamentoItens.id))
    .all();

  return { orcamento, itens };
}
