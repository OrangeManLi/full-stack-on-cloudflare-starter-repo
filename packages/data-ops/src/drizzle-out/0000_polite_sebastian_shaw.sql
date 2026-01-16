CREATE TABLE `links` (
	`link_id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`destinations` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
