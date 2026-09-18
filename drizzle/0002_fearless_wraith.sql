CREATE TABLE `contacts` (
	`owner` text NOT NULL,
	`friend_id` text NOT NULL,
	PRIMARY KEY(`owner`, `friend_id`)
);
--> statement-breakpoint
CREATE TABLE `direct_rooms` (
	`pair` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`token` text NOT NULL,
	`room_id` text NOT NULL,
	`last_read` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`token`, `room_id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`token` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT '근무 중' NOT NULL,
	`photo_id` text,
	`seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_public_id` ON `profiles` (`public_id`);--> statement-breakpoint
CREATE INDEX `idx_files_room_id` ON `files` (`room_id`);