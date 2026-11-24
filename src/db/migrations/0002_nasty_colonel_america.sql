ALTER TABLE `sync_outbox` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sync_outbox` ADD `next_attempt_at` text;