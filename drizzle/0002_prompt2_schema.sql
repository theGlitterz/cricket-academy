-- ─── Prompt 2 Migration: Refined Data Model ───────────────────────────────────
-- Creates the facilities table and updates services, slots, bookings
-- to match the Prompt 2 spec exactly.

-- 1. Create facilities table (replaces facility_settings)
CREATE TABLE `facilities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `facilityName` varchar(128) NOT NULL,
  `coachName` varchar(128),
  `coachWhatsApp` varchar(20),
  `upiId` varchar(128),
  `upiQrImageUrl` text,
  `address` text,
  `workingHours` varchar(64),
  `paymentInstructions` text,
  `googleMapsUrl` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 2. Add facilityId to services
ALTER TABLE `services`
  ADD COLUMN `facilityId` int NOT NULL DEFAULT 1 AFTER `id`,
  ADD COLUMN `price` decimal(10,2) NOT NULL DEFAULT 0 AFTER `facilityId`,
  ADD COLUMN `activeStatus` boolean NOT NULL DEFAULT true AFTER `price`;
--> statement-breakpoint

-- 3. Copy pricePerSlot → price, isActive → activeStatus for existing rows
UPDATE `services` SET `price` = `pricePerSlot`, `activeStatus` = `isActive`;
--> statement-breakpoint

-- 4. Add facilityId and availabilityStatus to slots
ALTER TABLE `slots`
  ADD COLUMN `facilityId` int NOT NULL DEFAULT 1 AFTER `id`,
  ADD COLUMN `availabilityStatus` enum('available','booked','blocked') NOT NULL DEFAULT 'available' AFTER `endTime`;
--> statement-breakpoint

-- 5. Sync availabilityStatus from isBlocked and bookedCount
UPDATE `slots`
SET `availabilityStatus` = CASE
  WHEN `isBlocked` = true THEN 'blocked'
  WHEN `bookedCount` > 0 THEN 'booked'
  ELSE 'available'
END;
--> statement-breakpoint

-- 6. Add new columns to bookings
ALTER TABLE `bookings`
  ADD COLUMN `facilityId` int NOT NULL DEFAULT 1 AFTER `id`,
  ADD COLUMN `bookingDate` varchar(10) NOT NULL DEFAULT '' AFTER `playerEmail`,
  ADD COLUMN `startTime` varchar(5) NOT NULL DEFAULT '' AFTER `bookingDate`,
  ADD COLUMN `endTime` varchar(5) NOT NULL DEFAULT '' AFTER `startTime`,
  ADD COLUMN `amount` decimal(10,2) NOT NULL DEFAULT 0 AFTER `endTime`,
  ADD COLUMN `screenshotUrl` text AFTER `amount`,
  ADD COLUMN `paymentStatus` enum('pending_review','confirmed','rejected') NOT NULL DEFAULT 'pending_review' AFTER `screenshotUrl`,
  ADD COLUMN `bookingStatus` enum('pending','confirmed','rejected','cancelled') NOT NULL DEFAULT 'pending' AFTER `paymentStatus`;
--> statement-breakpoint

-- 7. Backfill denormalized booking fields from slots join
UPDATE `bookings` b
JOIN `slots` s ON b.`slotId` = s.`id`
SET
  b.`bookingDate` = s.`date`,
  b.`startTime` = s.`startTime`,
  b.`endTime` = s.`endTime`;
--> statement-breakpoint

-- 8. Backfill amount from services
UPDATE `bookings` b
JOIN `services` sv ON b.`serviceId` = sv.`id`
SET b.`amount` = sv.`price`
WHERE b.`amount` = 0;
--> statement-breakpoint

-- 9. Copy existing status → bookingStatus, paymentScreenshotUrl → screenshotUrl
UPDATE `bookings`
SET
  `bookingStatus` = `status`,
  `screenshotUrl` = `paymentScreenshotUrl`,
  `paymentStatus` = CASE
    WHEN `status` = 'confirmed' THEN 'confirmed'
    WHEN `status` = 'rejected' THEN 'rejected'
    ELSE 'pending_review'
  END;
