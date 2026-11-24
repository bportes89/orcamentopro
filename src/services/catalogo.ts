import { and, asc, eq, isNull } from "drizzle-orm";

import { catalogoItens } from "@/db/schema";
import { db } from "@/db/sqlite";
import { withOutbox } from "@/db/sync/outbox";

export type LocalCatalogoItem = typeof catalogoItens.$inferSelect;

export type CatalogoItemInput = {
  descricao: string;
  unidade: string;
  precoUnitario: number;
};

export function listarItens(userId: string): LocalCatalogoItem[] {
  return db
    .select()
    .from(catalogoItens)
    .where(
      and(eq(catalogoItens.userId, userId), isNull(catalogoItens.deletedAt)),
    )
    .orderBy(asc(catalogoItens.descricao))
    .all();
}

export function criarItem(
  userId: string,
  input: CatalogoItemInput,
): LocalCatalogoItem {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const item: LocalCatalogoItem = {
    id,
    userId,
    descricao: input.descricao.trim(),
    precoUnitario: input.precoUnitario,
    unidade: input.unidade.trim() || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  withOutbox(
    {
      action: "insert",
      table: "catalogo_itens",
      payload: {
        id,
        user_id: userId,
        descricao: item.descricao,
        preco_unitario: item.precoUnitario,
        unidade: item.unidade,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
    },
    (tx) => {
      tx.insert(catalogoItens).values(item).run();
    },
  );

  return item;
}

export function atualizarItem(
  userId: string,
  id: string,
  input: CatalogoItemInput,
): void {
  const now = new Date().toISOString();
  const descricao = input.descricao.trim();
  const unidade = input.unidade.trim() || null;

  withOutbox(
    {
      action: "update",
      table: "catalogo_itens",
      payload: {
        id,
        descricao,
        preco_unitario: input.precoUnitario,
        unidade,
        updated_at: now,
      },
    },
    (tx) => {
      tx.update(catalogoItens)
        .set({
          descricao,
          precoUnitario: input.precoUnitario,
          unidade,
          updatedAt: now,
        })
        .where(
          and(
            eq(catalogoItens.id, id),
            eq(catalogoItens.userId, userId),
            isNull(catalogoItens.deletedAt),
          ),
        )
        .run();
    },
  );
}

export function deletarItem(userId: string, id: string): void {
  const now = new Date().toISOString();

  withOutbox(
    {
      action: "delete",
      table: "catalogo_itens",
      payload: { id, deleted_at: now, updated_at: now },
    },
    (tx) => {
      tx.update(catalogoItens)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            eq(catalogoItens.id, id),
            eq(catalogoItens.userId, userId),
            isNull(catalogoItens.deletedAt),
          ),
        )
        .run();
    },
  );
}
