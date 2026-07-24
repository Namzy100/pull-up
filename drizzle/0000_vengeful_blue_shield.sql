CREATE TABLE `attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`status` text DEFAULT 'interested' NOT NULL,
	`visibility` text DEFAULT 'friends' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attendance_event_idx` ON `attendances` (`event_id`);--> statement-breakpoint
CREATE INDEX `attendance_profile_idx` ON `attendances` (`profile_id`);--> statement-breakpoint
CREATE TABLE `campuses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`timezone` text DEFAULT 'America/Chicago' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_scores` (
	`event_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`confidence` integer NOT NULL,
	`demand_quality` integer NOT NULL,
	`manipulation_risk` text NOT NULL,
	`explanation` text NOT NULL,
	`computed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`campus_id` text NOT NULL,
	`venue_id` text NOT NULL,
	`host_organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`cover` text DEFAULT 'Unknown' NOT NULL,
	`age_rule` text DEFAULT 'Unknown' NOT NULL,
	`capacity_estimate` integer,
	`invite_mode` text DEFAULT 'open' NOT NULL,
	`created_by_profile_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`host_organization_id`) REFERENCES `host_organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_campus_status_idx` ON `events` (`campus_id`,`status`);--> statement-breakpoint
CREATE INDEX `events_host_idx` ON `events` (`host_organization_id`);--> statement-breakpoint
CREATE INDEX `events_starts_at_idx` ON `events` (`starts_at`);--> statement-breakpoint
CREATE TABLE `host_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`campus_id` text NOT NULL,
	`owner_profile_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `host_orgs_campus_idx` ON `host_organizations` (`campus_id`);--> statement-breakpoint
CREATE INDEX `host_orgs_owner_idx` ON `host_organizations` (`owner_profile_id`);--> statement-breakpoint
CREATE TABLE `host_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`submitted_by_profile_id` text NOT NULL,
	`line_state` text NOT NULL,
	`capacity_pressure` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `host_reports_event_idx` ON `host_reports` (`event_id`);--> statement-breakpoint
CREATE INDEX `host_reports_status_idx` ON `host_reports` (`review_status`);--> statement-breakpoint
CREATE TABLE `moderation_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`reviewer_profile_id` text,
	`severity` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`reason` text NOT NULL,
	`decision` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `moderation_event_idx` ON `moderation_reviews` (`event_id`);--> statement-breakpoint
CREATE INDEX `moderation_status_idx` ON `moderation_reviews` (`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`campus_id` text,
	`role` text DEFAULT 'student' NOT NULL,
	`avatar_url` text,
	`bio` text DEFAULT '' NOT NULL,
	`class_year` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE INDEX `profiles_campus_idx` ON `profiles` (`campus_id`);--> statement-breakpoint
CREATE TABLE `signal_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`profile_id` text,
	`source` text NOT NULL,
	`weight` real NOT NULL,
	`verification_level` real NOT NULL,
	`trust_score` real NOT NULL,
	`expires_at` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `signals_event_idx` ON `signal_events` (`event_id`);--> statement-breakpoint
CREATE INDEX `signals_source_idx` ON `signal_events` (`source`);--> statement-breakpoint
CREATE INDEX `signals_expires_idx` ON `signal_events` (`expires_at`);--> statement-breakpoint
CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`campus_id` text NOT NULL,
	`host_organization_id` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`address` text,
	`latitude` real,
	`longitude` real,
	`age_rule` text DEFAULT 'Unknown' NOT NULL,
	`default_cover` text DEFAULT 'Unknown' NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`host_organization_id`) REFERENCES `host_organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `venues_campus_idx` ON `venues` (`campus_id`);--> statement-breakpoint
CREATE INDEX `venues_host_idx` ON `venues` (`host_organization_id`);