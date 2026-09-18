CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`mime` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
