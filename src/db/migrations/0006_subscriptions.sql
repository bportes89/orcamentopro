CREATE TABLE `subscriptions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`expires_at` text,
	`platform` text,
	`original_transaction_id` text,
	`updated_at` text NOT NULL
);
