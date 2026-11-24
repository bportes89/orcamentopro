CREATE TABLE `sync_state` (
	`table` text PRIMARY KEY NOT NULL,
	`last_synced_at` text
);
--> statement-breakpoint
ALTER TABLE `orcamento_itens` ADD `updated_at` text NOT NULL;