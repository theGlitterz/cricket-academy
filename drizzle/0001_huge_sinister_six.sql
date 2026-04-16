CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceId` varchar(32) NOT NULL,
	`slotId` int NOT NULL,
	`serviceId` int NOT NULL,
	`playerName` varchar(128) NOT NULL,
	`playerWhatsApp` varchar(20) NOT NULL,
	`playerEmail` varchar(320),
	`amountPaid` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`paymentScreenshotUrl` text,
	`adminNote` text,
	`reviewedAt` timestamp,
	`reviewedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_referenceId_unique` UNIQUE(`referenceId`)
);
--> statement-breakpoint
CREATE TABLE `facility_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facilityName` varchar(128) NOT NULL DEFAULT 'BestCricketAcademy',
	`address` text,
	`contactWhatsApp` varchar(20),
	`upiId` varchar(128),
	`upiQrCodeUrl` text,
	`paymentInstructions` text,
	`workingHours` varchar(64),
	`googleMapsUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facility_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`pricePerSlot` decimal(10,2) NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 60,
	`maxCapacity` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `services_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`bookedCount` int NOT NULL DEFAULT 0,
	`maxCapacity` int NOT NULL DEFAULT 1,
	`isBlocked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slots_id` PRIMARY KEY(`id`)
);
