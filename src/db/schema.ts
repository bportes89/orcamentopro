import { sql, type SQL } from "drizzle-orm";
import {
  check,
  integer,
  numeric,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const isoNow = () => new Date().toISOString();

export const profiles = sqliteTable("profiles", (table) => ({
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  empresa: text("empresa"),
  chavePix: text("chave_pix"),
  logoUrl: text("logo_url"),
  onboardingDone: integer("onboarding_done").notNull().default(0),
  oficio: text("oficio"),
  createdAt: text("created_at").notNull().$defaultFn(isoNow),
  updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
}));

export const catalogoItens = sqliteTable(
  "catalogo_itens",
  (table) => ({
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    descricao: text("descricao").notNull(),
    precoUnitario: numeric("preco_unitario", { mode: "number" }).notNull(),
    unidade: text("unidade"),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
    deletedAt: text("deleted_at"),
  }),
  (table) => [
    check(
      "catalogo_itens_preco_unitario_check",
      sql`${table.precoUnitario} >= 0`,
    ),
  ],
);

export const orcamentos = sqliteTable(
  "orcamentos",
  (table) => ({
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    clienteNome: text("cliente_nome").notNull(),
    clienteEmail: text("cliente_email"),
    clienteTelefone: text("cliente_telefone"),
    status: text("status", {
      enum: ["rascunho", "enviado", "aprovado", "recusado"],
    })
      .notNull()
      .default("rascunho"),
    validadeDias: integer("validade_dias").notNull().default(15),
    observacoes: text("observacoes"),
    total: numeric("total", { mode: "number" }).notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
    respondidoEm: text("respondido_em"),
    enviadoEm: text("enviado_em"),
    deletedAt: text("deleted_at"),
  }),
  (table) => [
    check(
      "orcamentos_status_check",
      sql`${table.status} in ('rascunho', 'enviado', 'aprovado', 'recusado')`,
    ),
    check(
      "orcamentos_validade_dias_check",
      sql`${table.validadeDias} between 1 and 90`,
    ),
    check("orcamentos_total_check", sql`${table.total} >= 0`),
  ],
);

export const orcamentoItens = sqliteTable(
  "orcamento_itens",
  (table) => ({
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orcamentoId: text("orcamento_id")
      .notNull()
      .references(() => orcamentos.id, { onDelete: "cascade" }),
    descricao: text("descricao").notNull(),
    unidade: text("unidade"),
    quantidade: numeric("quantidade", { mode: "number" }).notNull(),
    precoUnitario: numeric("preco_unitario", { mode: "number" }).notNull(),
    subtotal: numeric("subtotal", { mode: "number" }).generatedAlwaysAs(
      (): SQL => sql`${orcamentoItens.quantidade} * ${orcamentoItens.precoUnitario}`,
      { mode: "stored" },
    ),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
  }),
  (table) => [
    check("orcamento_itens_quantidade_check", sql`${table.quantidade} > 0`),
    check(
      "orcamento_itens_preco_unitario_check",
      sql`${table.precoUnitario} >= 0`,
    ),
  ],
);

export const subscriptions = sqliteTable("subscriptions", (table) => ({
  userId: text("user_id").primaryKey(),
  status: text("status", {
    enum: [
      "inactive",
      "active",
      "trialing",
      "grace_period",
      "billing_issue",
      "canceled",
      "expired",
    ],
  })
    .notNull()
    .default("inactive"),
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  expiresAt: text("expires_at"),
  platform: text("platform"),
  originalTransactionId: text("original_transaction_id"),
  updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
}));

export const syncState = sqliteTable("sync_state", (table) => ({
  table: text("table").primaryKey(),
  lastSyncedAt: text("last_synced_at"),
}));

export const syncOutbox = sqliteTable(
  "sync_outbox",
  (table) => ({
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    action: text("action", { enum: ["insert", "update", "delete"] }).notNull(),
    table: text("table").notNull(),
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    status: text("status", { enum: ["pending", "failed"] })
      .notNull()
      .default("pending"),
    nextAttemptAt: text("next_attempt_at"),
  }),
  (table) => [
    check(
      "sync_outbox_action_check",
      sql`${table.action} in ('insert', 'update', 'delete')`,
    ),
    check("sync_outbox_attempts_check", sql`${table.attempts} >= 0`),
  ],
);
