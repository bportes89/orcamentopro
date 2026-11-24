import { asc, eq, sql } from "drizzle-orm";

import { syncOutbox } from "@/db/schema";
import { db } from "@/db/sqlite";

export type OutboxAction = "insert" | "update" | "delete";

export type OutboxTable =
  | "profiles"
  | "catalogo_itens"
  | "orcamentos"
  | "orcamento_itens";

export type OutboxStatus = "pending" | "failed";

export type EnqueueOutboxParams = {
  action: OutboxAction;
  table: OutboxTable;
  payload: Record<string, unknown>;
};

export type MarkOutboxEntryFailedParams = {
  attempts: number;
  lastError: string;
  nextAttemptAt: string | null;
  status: OutboxStatus;
};

export type OutboxEntry = typeof syncOutbox.$inferSelect;

export type TransactionClient = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export function enqueue(
  tx: TransactionClient,
  action: OutboxAction,
  table: OutboxTable,
  payload: Record<string, unknown>,
): void {
  tx.insert(syncOutbox)
    .values({
      action,
      table,
      payload: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    })
    .run();
}

export function enqueueOutbox(
  tx: TransactionClient,
  { action, table, payload }: EnqueueOutboxParams,
): void {
  enqueue(tx, action, table, payload);
}

export function withOutbox<T>(
  entry: EnqueueOutboxParams,
  mutate: (tx: TransactionClient) => T,
): T {
  return db.transaction((tx) => {
    const result = mutate(tx);
    enqueueOutbox(tx, entry);
    return result;
  });
}

export function listPendingOutbox(): OutboxEntry[] {
  return db
    .select()
    .from(syncOutbox)
    .where(eq(syncOutbox.status, "pending"))
    .orderBy(asc(syncOutbox.createdAt), sql`rowid asc`)
    .all();
}

export function countPendingOutbox(): number {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(syncOutbox)
    .where(eq(syncOutbox.status, "pending"))
    .get();

  return result ? Number(result.count) : 0;
}

export function countFailedOutbox(): number {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(syncOutbox)
    .where(eq(syncOutbox.status, "failed"))
    .get();

  return result ? Number(result.count) : 0;
}

export function markOutboxEntryFailed(
  id: string,
  { attempts, lastError, nextAttemptAt, status }: MarkOutboxEntryFailedParams,
): void {
  db.update(syncOutbox)
    .set({ attempts, lastError, nextAttemptAt, status })
    .where(eq(syncOutbox.id, id))
    .run();
}

export function deleteOutboxEntry(id: string): void {
  db.delete(syncOutbox).where(eq(syncOutbox.id, id)).run();
}
