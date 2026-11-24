import NetInfo from "@react-native-community/netinfo";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  countFailedOutbox,
  countPendingOutbox,
  deleteOutboxEntry,
  listPendingOutbox,
  markOutboxEntryFailed,
  type OutboxEntry,
  type OutboxTable,
} from "@/db/sync/outbox";
import { setSyncStatus } from "@/services/sync-status";
import { supabase } from "@/services/supabase";
import {
  assertQuotaRemota,
  QuotaRejectedError,
  sincronizarAssinatura,
} from "@/services/subscription";

const CONNECT_DEBOUNCE_MS = 2_000;
const NETWORK_RETRY_MS = 30_000;
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [30_000, 120_000, 600_000] as const;

const OUTBOX_TABLES: OutboxTable[] = [
  "profiles",
  "catalogo_itens",
  "orcamentos",
  "orcamento_itens",
];

const SOFT_DELETE_TABLES: OutboxTable[] = ["catalogo_itens", "orcamentos"];

function parsePayload(raw: string): Record<string, unknown> {
  const payload: unknown = JSON.parse(raw);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload inválido na fila de sincronização.");
  }

  return payload as Record<string, unknown>;
}

function resolveTable(raw: string): OutboxTable {
  if (OUTBOX_TABLES.includes(raw as OutboxTable)) {
    return raw as OutboxTable;
  }

  throw new Error(`Tabela não suportada na sincronização: ${raw}`);
}

function resolveSyncError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return "Erro desconhecido ao sincronizar.";
}

function isNetworkFailure(error: unknown): boolean {
  const message = resolveSyncError(error).toLowerCase();

  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("networkerror")
  );
}

async function executeEntry(entry: OutboxEntry): Promise<void> {
  const payload = parsePayload(entry.payload);
  const table = resolveTable(entry.table);
  const client = supabase as unknown as SupabaseClient;

  if (entry.action === "insert") {
    if (table === "orcamentos") {
      const userId = payload.user_id;

      if (typeof userId !== "string" || !userId) {
        throw new Error("Orçamento sem usuário na fila de sincronização.");
      }

      await assertQuotaRemota(userId);
    }

    const { error } = await client
      .from(table)
      .upsert(payload, { onConflict: "id" });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const id = payload.id;

  if (typeof id !== "string" || !id) {
    throw new Error("Operação de sincronização sem id no payload.");
  }

  if (entry.action === "update") {
    const values: Record<string, unknown> = { ...payload };
    delete values.id;

    const { error } = await client.from(table).update(values).eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (SOFT_DELETE_TABLES.includes(table)) {
    const now = new Date().toISOString();
    const { error } = await client
      .from(table)
      .update({
        deleted_at:
          typeof payload.deleted_at === "string" ? payload.deleted_at : now,
        updated_at:
          typeof payload.updated_at === "string" ? payload.updated_at : now,
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await client.from(table).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

class SyncManager {
  private started = false;
  private isConnected = false;
  private draining = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;

  start(): () => void {
    this.stop();
    this.started = true;

    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      this.handleConnectionChange(state.isConnected === true);
    });

    NetInfo.fetch()
      .then((state) => {
        if (this.started) {
          this.handleConnectionChange(state.isConnected === true, true);
        }
      })
      .catch(() => {
        if (this.started) {
          this.isConnected = false;
          setSyncStatus("offline");
        }
      });

    return () => {
      this.stop();
    };
  }

  private stop(): void {
    this.started = false;
    this.isConnected = false;
    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = null;
    this.clearTimers();
    setSyncStatus("idle");
  }

  private handleConnectionChange(connected: boolean, immediate = false): void {
    const wasConnected = this.isConnected;
    this.isConnected = connected;

    if (!connected) {
      this.clearTimers();

      if (!this.draining) {
        setSyncStatus("offline");
      }

      return;
    }

    if (immediate) {
      this.clearDebounce();
      void this.drain();
      return;
    }

    if (!wasConnected) {
      this.scheduleDrain(CONNECT_DEBOUNCE_MS);
    }
  }

  private scheduleDrain(delayMs: number): void {
    this.clearDebounce();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.drain();
    }, delayMs);
  }

  private scheduleRetryAt(date: string): void {
    this.clearRetry();
    const delayMs = Math.max(0, Date.parse(date) - Date.now());

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.drain();
    }, delayMs);
  }

  private clearDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private clearRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearDebounce();
    this.clearRetry();
  }

  private finishStatus(hadFailure: boolean): void {
    if (!this.isConnected) {
      setSyncStatus("offline");
      return;
    }

    if (hadFailure || countFailedOutbox() > 0) {
      setSyncStatus("error");
      return;
    }

    setSyncStatus("idle");
  }

  async drain(): Promise<void> {
    if (this.draining || !this.started) {
      return;
    }

    if (!this.isConnected) {
      setSyncStatus("offline");
      return;
    }

    this.draining = true;
    this.clearRetry();
    setSyncStatus("syncing");

    let hadFailure = false;

    try {
      const entries = listPendingOutbox();
      const usuarios = new Set<string>();

      for (const entry of entries) {
        const payload = parsePayload(entry.payload);
        const userId = payload.user_id;

        if (typeof userId === "string" && userId) {
          usuarios.add(userId);
        }
      }

      for (const userId of usuarios) {
        try {
          await sincronizarAssinatura(userId);
        } catch (error) {
          if (!this.isConnected || isNetworkFailure(error)) {
            setSyncStatus(this.isConnected ? "error" : "offline");

            if (this.isConnected) {
              this.scheduleDrain(NETWORK_RETRY_MS);
            }

            return;
          }

          throw error;
        }
      }

      for (const entry of entries) {
        if (!this.started) {
          setSyncStatus("idle");
          return;
        }

        if (!this.isConnected) {
          setSyncStatus("offline");
          return;
        }

        if (
          entry.nextAttemptAt &&
          Date.parse(entry.nextAttemptAt) > Date.now()
        ) {
          this.scheduleRetryAt(entry.nextAttemptAt);
          break;
        }

        try {
          await executeEntry(entry);
          deleteOutboxEntry(entry.id);
        } catch (error) {
          if (error instanceof QuotaRejectedError) {
            hadFailure = true;
            markOutboxEntryFailed(entry.id, {
              attempts: MAX_ATTEMPTS,
              lastError: resolveSyncError(error),
              nextAttemptAt: null,
              status: "failed",
            });
            continue;
          }

          if (!this.isConnected || isNetworkFailure(error)) {
            setSyncStatus(this.isConnected ? "error" : "offline");

            if (this.isConnected) {
              this.scheduleDrain(NETWORK_RETRY_MS);
            }

            return;
          }

          hadFailure = true;
          const attempts = entry.attempts + 1;
          const message = resolveSyncError(error);

          if (attempts >= MAX_ATTEMPTS) {
            markOutboxEntryFailed(entry.id, {
              attempts,
              lastError: message,
              nextAttemptAt: null,
              status: "failed",
            });
            continue;
          }

          const delayMs =
            RETRY_DELAYS_MS[
              Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)
            ];
          const nextAttemptAt = new Date(Date.now() + delayMs).toISOString();

          markOutboxEntryFailed(entry.id, {
            attempts,
            lastError: message,
            nextAttemptAt,
            status: "pending",
          });
          this.scheduleRetryAt(nextAttemptAt);
          break;
        }
      }

      this.finishStatus(hadFailure);
    } catch {
      this.finishStatus(true);
    } finally {
      this.draining = false;

      if (
        this.started &&
        this.isConnected &&
        !this.debounceTimer &&
        !this.retryTimer &&
        countPendingOutbox() > 0
      ) {
        this.scheduleDrain(500);
      }
    }
  }
}

export const syncManager = new SyncManager();

export function startSyncManager(): () => void {
  return syncManager.start();
}

export function drain(): Promise<void> {
  return syncManager.drain();
}
