CREATE TABLE `analyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`emailCount` int DEFAULT 0,
	`workCount` int DEFAULT 0,
	`personalCount` int DEFAULT 0,
	`promotionsCount` int DEFAULT 0,
	`urgentCount` int DEFAULT 0,
	`averageResponseTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`condition` text NOT NULL,
	`action` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailId` int NOT NULL,
	`replyText` text NOT NULL,
	`replyIndex` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailId` int NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailSummaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gmailId` varchar(255) NOT NULL,
	`threadId` varchar(255) NOT NULL,
	`from` varchar(320) NOT NULL,
	`senderName` varchar(255),
	`to` text NOT NULL,
	`cc` text,
	`bcc` text,
	`subject` text,
	`snippet` text,
	`body` text,
	`isRead` int NOT NULL DEFAULT 0,
	`isStarred` int NOT NULL DEFAULT 0,
	`category` enum('Work','Personal','Promotions','Urgent','Other') DEFAULT 'Other',
	`aiScore` int DEFAULT 0,
	`hasSummary` int DEFAULT 0,
	`hasReplySuggestions` int DEFAULT 0,
	`receivedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_gmailId_unique` UNIQUE(`gmailId`)
);
--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` ADD CONSTRAINT `analyticsSnapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationRules` ADD CONSTRAINT `automationRules_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailReplies` ADD CONSTRAINT `emailReplies_emailId_emails_id_fk` FOREIGN KEY (`emailId`) REFERENCES `emails`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSummaries` ADD CONSTRAINT `emailSummaries_emailId_emails_id_fk` FOREIGN KEY (`emailId`) REFERENCES `emails`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;