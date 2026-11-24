CREATE TABLE `catalogo_itens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`descricao` text NOT NULL,
	`preco_unitario` numeric NOT NULL,
	`unidade` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "catalogo_itens_preco_unitario_check" CHECK("catalogo_itens"."preco_unitario" >= 0)
);
--> statement-breakpoint
CREATE TABLE `orcamento_itens` (
	`id` text PRIMARY KEY NOT NULL,
	`orcamento_id` text NOT NULL,
	`descricao` text NOT NULL,
	`quantidade` numeric NOT NULL,
	`preco_unitario` numeric NOT NULL,
	`subtotal` numeric GENERATED ALWAYS AS ("quantidade" * "preco_unitario") STORED,
	`created_at` text NOT NULL,
	FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "orcamento_itens_quantidade_check" CHECK("orcamento_itens"."quantidade" > 0),
	CONSTRAINT "orcamento_itens_preco_unitario_check" CHECK("orcamento_itens"."preco_unitario" >= 0)
);
--> statement-breakpoint
CREATE TABLE `orcamentos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cliente_nome` text NOT NULL,
	`cliente_email` text,
	`cliente_telefone` text,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`validade_dias` integer DEFAULT 15 NOT NULL,
	`observacoes` text,
	`total` numeric DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "orcamentos_status_check" CHECK("orcamentos"."status" in ('rascunho', 'enviado', 'aprovado', 'recusado')),
	CONSTRAINT "orcamentos_validade_dias_check" CHECK("orcamentos"."validade_dias" between 1 and 90),
	CONSTRAINT "orcamentos_total_check" CHECK("orcamentos"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`telefone` text,
	`empresa` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`table` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	CONSTRAINT "sync_outbox_action_check" CHECK("sync_outbox"."action" in ('insert', 'update', 'delete')),
	CONSTRAINT "sync_outbox_attempts_check" CHECK("sync_outbox"."attempts" >= 0)
);
