-- Migration: 0003_self_hosted_users
-- Replace Manus OAuth-based users table with self-hosted email+password table.
-- This drops the old users table and recreates it with the new schema.
-- WARNING: This will delete all existing user records. Admin credentials are
-- now managed via ADMIN_EMAIL + ADMIN_PASSWORD environment variables.

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(320) NOT NULL,
  `passwordHash` varchar(256) NOT NULL,
  `name` text,
  `role` enum('user','admin') NOT NULL DEFAULT 'admin',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
