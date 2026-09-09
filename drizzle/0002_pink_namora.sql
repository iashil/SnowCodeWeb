CREATE TABLE `local_admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(220) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`path` varchar(180) NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_views_path_unique` UNIQUE(`path`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryColor` varchar(32) NOT NULL DEFAULT '#1c2826',
	`accentColor` varchar(32) NOT NULL DEFAULT '#8ca68f',
	`backgroundColor` varchar(32) NOT NULL DEFAULT '#f5f4ee',
	`surfaceColor` varchar(32) NOT NULL DEFAULT '#dbe5d6',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`role` varchar(180) NOT NULL,
	`avatarUrl` varchar(700),
	`instagramUrl` varchar(700),
	`whatsappUrl` varchar(700),
	`githubUrl` varchar(700),
	`linkedinUrl` varchar(700),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
