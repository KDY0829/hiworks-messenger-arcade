CREATE TABLE `game_events` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`name` text NOT NULL,
	`text` text NOT NULL,
	`time` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_game_events_room_time` ON `game_events` (`room_id`,`time`);--> statement-breakpoint
CREATE TABLE `sword_progress` (
	`token` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_request` text DEFAULT '' NOT NULL
);
