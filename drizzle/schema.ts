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

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Core user table backing auth flow.
 * role='admin' grants access to the admin panel.
 */
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

// ─── Facilities ───────────────────────────────────────────────────────────────

/**
 * Represents a single cricket facility.
 *
 * V1 uses exactly one facility (BestCricketAcademy, id=1).
 * The schema is designed to support multiple facilities in the future —
 * all downstream tables carry a facilityId foreign key.
 *
 * Fields map directly to the Prompt 2 spec:
 *   id, facility_name, coach_name, coach_whatsapp_number,
 *   upi_id, upi_qr_image_url
 *
 * Extended with operational fields:
 *   address, working_hours, payment_instructions, google_maps_url
 */
export const facilities = mysqlTable("facilities", {
  id: int("id").autoincrement().primaryKey(),
  /** Display name, e.g. "BestCricketAcademy" */
  facilityName: varchar("facilityName", { length: 128 }).notNull(),
  /** Coach / owner full name */
  coachName: varchar("coachName", { length: 128 }),
  /** Primary WhatsApp contact for the coach */
  coachWhatsApp: varchar("coachWhatsApp", { length: 20 }),
  /** UPI ID for payment, e.g. coach@upi or 9876543210@paytm */
  upiId: varchar("upiId", { length: 128 }),
  /** S3 URL of the UPI QR code image */
  upiQrImageUrl: text("upiQrImageUrl"),
  /** Full address shown on the booking page */
  address: text("address"),
  /** Working hours display string, e.g. "6:00 AM – 9:00 PM" */
  workingHours: varchar("workingHours", { length: 64 }),
  /** Short note shown on payment page */
  paymentInstructions: text("paymentInstructions"),
  /** Google Maps link */
  googleMapsUrl: text("googleMapsUrl"),
  /** Whether this facility is publicly visible */
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * A bookable service offered by a facility.
 * V1 services: Ground Booking, Net Practice, Personal Coaching.
 *
 * Fields map to Prompt 2 spec:
 *   id, facility_id, name, duration_minutes, price, active_status
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → facilities.id */
  facilityId: int("facilityId").notNull(),
  /** URL-safe slug used in booking links, e.g. "ground-booking" */
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  /** Display name, e.g. "Ground Booking" */
  name: varchar("name", { length: 128 }).notNull(),
  /** Short description shown on the booking page */
  description: text("description"),
  /** Session duration in minutes */
  durationMinutes: int("durationMinutes").notNull().default(60),
  /** Price per slot in INR (decimal for future multi-currency support) */
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  /** active_status: whether this service is available for booking */
  activeStatus: boolean("activeStatus").notNull().default(true),
  /** Display order on the booking page */
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Slots ────────────────────────────────────────────────────────────────────

/**
 * A specific time window on a specific date for a service at a facility.
 *
 * Fields map to Prompt 2 spec:
 *   id, facility_id, service_id, date, start_time, end_time, availability_status
 *
 * availability_status values:
 *   available — open for booking
 *   booked    — a confirmed or pending booking occupies this slot
 *   blocked   — admin has manually blocked this slot (no bookings allowed)
 */
export const slots = mysqlTable("slots", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → facilities.id */
  facilityId: int("facilityId").notNull(),
  /** FK → services.id */
  serviceId: int("serviceId").notNull(),
  /** Date in YYYY-MM-DD format */
  date: varchar("date", { length: 10 }).notNull(),
  /** Start time in HH:MM (24h) format */
  startTime: varchar("startTime", { length: 5 }).notNull(),
  /** End time in HH:MM (24h) format */
  endTime: varchar("endTime", { length: 5 }).notNull(),
  /**
   * availability_status:
   *   available — open for booking
   *   booked    — occupied by a pending or confirmed booking
   *   blocked   — manually blocked by admin
   */
  availabilityStatus: mysqlEnum("availabilityStatus", [
    "available",
    "booked",
    "blocked",
  ])
    .notNull()
    .default("available"),
  /** Max concurrent bookings (for net lanes that allow 2 players) */
  maxCapacity: int("maxCapacity").notNull().default(1),
  /** Current booking count (pending + confirmed) for capacity tracking */
  bookedCount: int("bookedCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Slot = typeof slots.$inferSelect;
export type InsertSlot = typeof slots.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * A player's booking request for a specific slot.
 *
 * Fields map to Prompt 2 spec:
 *   id, facility_id, service_id, player_name, player_whatsapp_number,
 *   booking_date, start_time, end_time, amount,
 *   screenshot_url, payment_status, booking_status, created_at
 *
 * payment_status values:
 *   pending_review — player has submitted, coach has not reviewed yet
 *   confirmed      — coach verified payment and confirmed
 *   rejected       — coach rejected (wrong amount, unclear screenshot, etc.)
 *
 * booking_status values:
 *   pending    — submitted, awaiting coach review
 *   confirmed  — coach confirmed payment and booking
 *   rejected   — coach rejected the booking
 *   cancelled  — player or admin cancelled after confirmation
 *
 * Status lifecycle:
 *   pending → confirmed  (coach confirms payment)
 *   pending → rejected   (coach rejects; slot reverts to available)
 *   confirmed → cancelled (admin/player cancels; slot reverts to available)
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  /** Short human-readable reference, e.g. BCA-20240409-1234 */
  referenceId: varchar("referenceId", { length: 32 }).notNull().unique(),
  /** FK → facilities.id */
  facilityId: int("facilityId").notNull(),
  /** FK → services.id */
  serviceId: int("serviceId").notNull(),
  /** FK → slots.id — the specific slot being booked */
  slotId: int("slotId").notNull(),
  /** Player's full name */
  playerName: varchar("playerName", { length: 128 }).notNull(),
  /** WhatsApp number with country code, e.g. +919876543210 */
  playerWhatsApp: varchar("playerWhatsApp", { length: 20 }).notNull(),
  /** Optional email for future notification support */
  playerEmail: varchar("playerEmail", { length: 320 }),
  /**
   * Denormalized from slot for easy querying without joins.
   * booking_date: YYYY-MM-DD
   */
  bookingDate: varchar("bookingDate", { length: 10 }).notNull(),
  /** Denormalized start time HH:MM */
  startTime: varchar("startTime", { length: 5 }).notNull(),
  /** Denormalized end time HH:MM */
  endTime: varchar("endTime", { length: 5 }).notNull(),
  /** Amount in INR — copied from service price at time of booking */
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  /** S3 URL of the UPI payment screenshot uploaded by the player */
  screenshotUrl: text("screenshotUrl"),
  /**
   * payment_status:
   *   pending_review — awaiting coach review
   *   confirmed      — payment verified
   *   rejected       — payment rejected
   */
  paymentStatus: mysqlEnum("paymentStatus", [
    "pending_review",
    "confirmed",
    "rejected",
  ])
    .notNull()
    .default("pending_review"),
  /**
   * booking_status:
   *   pending   — awaiting coach action
   *   confirmed — booking is confirmed
   *   rejected  — booking was rejected
   *   cancelled — booking was cancelled after confirmation
   */
  bookingStatus: mysqlEnum("bookingStatus", [
    "pending",
    "confirmed",
    "rejected",
    "cancelled",
  ])
    .notNull()
    .default("pending"),
  /** Admin note when confirming or rejecting */
  adminNote: text("adminNote"),
  /** UTC timestamp when the booking was reviewed */
  reviewedAt: timestamp("reviewedAt"),
  /** ID of the admin user who reviewed */
  reviewedByUserId: int("reviewedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Legacy alias (kept for backward compat during migration) ─────────────────
// The old facilitySettings table is replaced by the facilities table.
// This alias allows old code to compile during the transition.
export const facilitySettings = facilities;
export type FacilitySettings = Facility;
export type InsertFacilitySettings = InsertFacility;
