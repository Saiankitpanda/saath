CREATE TABLE `call_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`host_id` text NOT NULL,
	`guest_id` text NOT NULL,
	`host_name` text NOT NULL,
	`guest_name` text NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`status` text DEFAULT 'ringing' NOT NULL,
	`provider` text DEFAULT 'webrtc' NOT NULL,
	`media` text DEFAULT 'voice' NOT NULL,
	`host_sdp` text DEFAULT '' NOT NULL,
	`guest_sdp` text DEFAULT '' NOT NULL,
	`host_ice` text DEFAULT '[]' NOT NULL,
	`guest_ice` text DEFAULT '[]' NOT NULL,
	`livekit_room` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calls_code_idx` ON `call_sessions` (`code`);
--> statement-breakpoint
CREATE INDEX `calls_host_idx` ON `call_sessions` (`host_id`);
--> statement-breakpoint
CREATE INDEX `calls_guest_idx` ON `call_sessions` (`guest_id`);
--> statement-breakpoint
CREATE INDEX `calls_source_idx` ON `call_sessions` (`source`,`source_id`);
