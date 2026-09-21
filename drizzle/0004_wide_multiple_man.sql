CREATE TABLE `quiz_history` (
	`token` text NOT NULL,
	`fingerprint` text NOT NULL,
	`seen_at` integer NOT NULL,
	PRIMARY KEY(`token`, `fingerprint`)
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_history_seen` ON `quiz_history` (`token`,`seen_at`);--> statement-breakpoint
CREATE TABLE `quiz_provider_state` (
	`provider` text PRIMARY KEY NOT NULL,
	`token` text,
	`refreshed_at` integer DEFAULT 0 NOT NULL,
	`last_error` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_question_id` text,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`accepted_answers` text DEFAULT '[]' NOT NULL,
	`difficulty` text NOT NULL,
	`category` text NOT NULL,
	`source` text NOT NULL,
	`fingerprint` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_quiz_questions_fingerprint` ON `quiz_questions` (`fingerprint`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_quiz_questions_provider_id` ON `quiz_questions` (`provider`,`provider_question_id`);--> statement-breakpoint
CREATE INDEX `idx_quiz_questions_difficulty_category` ON `quiz_questions` (`difficulty`,`category`,`use_count`);--> statement-breakpoint
PRAGMA optimize;
