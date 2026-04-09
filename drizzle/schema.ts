import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (Manus OAuth) ──────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Services ────────────────────────────────────────────────────────────────
// The three bookable services offered by the facility.

export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique slug used in URLs, e.g. "ground-booking" */
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  /** Price in INR (paise-free, stored as rupees with 2 decimal places) */
  pricePerSlot: decimal("pricePerSlot", { precision: 10, scale: 2 }).notNull(),
  /** Duration of one slot in minutes */
  durationMinutes: int("durationMinutes").notNull().default(60),
  /** Max concurrent bookings for the same slot */
  maxCapacity: int("maxCapacity").notNull().default(1),
  isActive: boolean("isActive").notNull().default(true),
  /** Display order on the booking page */
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Slots ────────────────────────────────────────────────────────────────────
// Represents a specific time window on a specific date for a service.

export const slots = mysqlTable("slots", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull(),
  /** Date in YYYY-MM-DD format stored as varchar for simplicity */
  date: varchar("date", { length: 10 }).notNull(),
  /** Start time in HH:MM (24h) format */
  startTime: varchar("startTime", { length: 5 }).notNull(),
  /** End time in HH:MM (24h) format */
  endTime: varchar("endTime", { length: 5 }).notNull(),
  /** Current confirmed + pending booking count */
  bookedCount: int("bookedCount").notNull().default(0),
  /** Max concurrent bookings (copied from service, can be overridden) */
  maxCapacity: int("maxCapacity").notNull().default(1),
  /** Admin can manually block a slot even if capacity remains */
  isBlocked: boolean("isBlocked").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Slot = typeof slots.$inferSelect;
export type InsertSlot = typeof slots.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────────────
// A player's booking request for a specific slot.

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  /** Short human-readable reference, e.g. BCA-2024-0001 */
  referenceId: varchar("referenceId", { length: 32 }).notNull().unique(),
  slotId: int("slotId").notNull(),
  serviceId: int("serviceId").notNull(),
  /** Player's full name */
  playerName: varchar("playerName", { length: 128 }).notNull(),
  /** WhatsApp number with country code, e.g. +919876543210 */
  playerWhatsApp: varchar("playerWhatsApp", { length: 20 }).notNull(),
  /** Optional email for confirmation */
  playerEmail: varchar("playerEmail", { length: 320 }),
  /** Amount paid in INR */
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).notNull(),
  /**
   * pending   — submitted, awaiting payment upload or coach review
   * confirmed — coach has verified payment and confirmed the booking
   * rejected  — coach has rejected (wrong payment, slot conflict, etc.)
   * cancelled — player or admin cancelled after confirmation
   */
  status: mysqlEnum("status", ["pending", "confirmed", "rejected", "cancelled"])
    .notNull()
    .default("pending"),
  /** S3 URL of the UPI payment screenshot uploaded by the player */
  paymentScreenshotUrl: text("paymentScreenshotUrl"),
  /** Admin note when confirming or rejecting */
  adminNote: text("adminNote"),
  /** UTC timestamp when the booking was confirmed/rejected */
  reviewedAt: timestamp("reviewedAt"),
  /** ID of the admin user who reviewed */
  reviewedByUserId: int("reviewedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Facility Settings ────────────────────────────────────────────────────────
// Single-row config table for the facility. Only one row should exist (id=1).

export const facilitySettings = mysqlTable("facility_settings", {
  id: int("id").autoincrement().primaryKey(),
  facilityName: varchar("facilityName", { length: 128 })
    .notNull()
    .default("BestCricketAcademy"),
  /** Full address shown on the booking page */
  address: text("address"),
  /** Primary contact WhatsApp number */
  contactWhatsApp: varchar("contactWhatsApp", { length: 20 }),
  /** UPI ID for payment, e.g. coach@upi */
  upiId: varchar("upiId", { length: 128 }),
  /** S3 URL of the UPI QR code image */
  upiQrCodeUrl: text("upiQrCodeUrl"),
  /** Short note shown on payment page, e.g. "Pay and upload screenshot" */
  paymentInstructions: text("paymentInstructions"),
  /** Working hours display string, e.g. "6:00 AM – 9:00 PM" */
  workingHours: varchar("workingHours", { length: 64 }),
  /** Google Maps embed URL or place link */
  googleMapsUrl: text("googleMapsUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FacilitySettings = typeof facilitySettings.$inferSelect;
export type InsertFacilitySettings = typeof facilitySettings.$inferInsert;
