CREATE TABLE `ai_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dateRangeStart` timestamp NOT NULL,
	`dateRangeEnd` timestamp NOT NULL,
	`platforms` json,
	`summary` text,
	`recommendations` json,
	`trends` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('google_ads','meta_ads','linkedin_ads','hubspot','all') NOT NULL,
	`metricType` enum('spend','ctr','cpc','conversions','impressions','roas') NOT NULL,
	`condition` enum('above','below') NOT NULL,
	`threshold` decimal(12,4) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertConfigId` int NOT NULL,
	`platform` enum('google_ads','meta_ads','linkedin_ads','hubspot','all') NOT NULL,
	`metricType` varchar(64) NOT NULL,
	`currentValue` decimal(12,4) NOT NULL,
	`threshold` decimal(12,4) NOT NULL,
	`message` text,
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`platform` enum('google_ads','meta_ads','linkedin_ads','hubspot') NOT NULL,
	`campaignId` varchar(128),
	`campaignName` varchar(512),
	`date` timestamp NOT NULL,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`spend` decimal(12,2) DEFAULT '0.00',
	`conversions` int DEFAULT 0,
	`reach` int DEFAULT 0,
	`actions` int DEFAULT 0,
	`ctr` decimal(8,4) DEFAULT '0.0000',
	`cpc` decimal(10,4) DEFAULT '0.0000',
	`cpm` decimal(10,4) DEFAULT '0.0000',
	`roas` decimal(10,4) DEFAULT '0.0000',
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hubspot_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`dataType` enum('contact','deal','campaign') NOT NULL,
	`recordId` varchar(128),
	`recordName` varchar(512),
	`stage` varchar(128),
	`value` decimal(12,2),
	`properties` json,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hubspot_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('google_ads','meta_ads','linkedin_ads','hubspot') NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`accountId` varchar(128),
	`accountName` varchar(256),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`format` enum('pdf','csv') NOT NULL,
	`dateRangeStart` timestamp NOT NULL,
	`dateRangeEnd` timestamp NOT NULL,
	`platforms` json,
	`fileUrl` text,
	`fileKey` varchar(512),
	`insights` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
