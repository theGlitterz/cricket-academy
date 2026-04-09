import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Booking,
  FacilitySettings,
  InsertBooking,
  InsertFacilitySettings,
  InsertService,
  InsertSlot,
  Service,
  Slot,
  InsertUser,
  bookings,
  facilitySettings,
  services,
  slots,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getActiveServices(): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(services.sortOrder);
}

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return result[0] ?? undefined;
}

export async function getAllServices(): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).orderBy(services.sortOrder);
}

export async function upsertService(data: InsertService): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(services).values(data).onDuplicateKeyUpdate({ set: data });
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export async function getAvailableSlots(serviceId: number, date: string): Promise<Slot[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(slots)
    .where(
      and(
        eq(slots.serviceId, serviceId),
        eq(slots.date, date),
        eq(slots.isBlocked, false),
        // bookedCount < maxCapacity — use raw SQL comparison
        sql`${slots.bookedCount} < ${slots.maxCapacity}`
      )
    )
    .orderBy(slots.startTime);
}

export async function getSlotById(id: number): Promise<Slot | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(slots).where(eq(slots.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getSlotsForDateRange(
  serviceId: number,
  fromDate: string,
  toDate: string
): Promise<Slot[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(slots)
    .where(
      and(
        eq(slots.serviceId, serviceId),
        gte(slots.date, fromDate),
        lte(slots.date, toDate)
      )
    )
    .orderBy(slots.date, slots.startTime);
}

export async function createSlot(data: InsertSlot): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(slots).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateSlotBlockStatus(id: number, isBlocked: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(slots).set({ isBlocked }).where(eq(slots.id, id));
}

export async function incrementSlotBookedCount(slotId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(slots)
    .set({ bookedCount: sql`${slots.bookedCount} + 1` })
    .where(eq(slots.id, slotId));
}

export async function decrementSlotBookedCount(slotId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(slots)
    .set({ bookedCount: sql`GREATEST(${slots.bookedCount} - 1, 0)` })
    .where(eq(slots.id, slotId));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

/** Generate a short human-readable reference like BCA-20240409-0042 */
export function generateReferenceId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `BCA-${dateStr}-${rand}`;
}

export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getBookingById(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getBookingByReference(referenceId: string): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.referenceId, referenceId))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getBookingsByWhatsApp(whatsApp: string): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.playerWhatsApp, whatsApp))
    .orderBy(desc(bookings.createdAt));
}

export async function getAllBookings(filters?: {
  status?: "pending" | "confirmed" | "rejected" | "cancelled";
  serviceId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.status) conditions.push(eq(bookings.status, filters.status));
  if (filters?.serviceId) conditions.push(eq(bookings.serviceId, filters.serviceId));

  return db
    .select()
    .from(bookings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt));
}

export async function updateBookingPaymentScreenshot(
  id: number,
  url: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ paymentScreenshotUrl: url }).where(eq(bookings.id, id));
}

export async function confirmBooking(
  id: number,
  reviewedByUserId: number,
  adminNote?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bookings)
    .set({
      status: "confirmed",
      reviewedByUserId,
      adminNote: adminNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(bookings.id, id));
}

export async function rejectBooking(
  id: number,
  reviewedByUserId: number,
  adminNote?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bookings)
    .set({
      status: "rejected",
      reviewedByUserId,
      adminNote: adminNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(bookings.id, id));
}

export async function cancelBooking(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
}

// ─── Facility Settings ────────────────────────────────────────────────────────

export async function getFacilitySettings(): Promise<FacilitySettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(facilitySettings).limit(1);
  return result[0] ?? undefined;
}

export async function upsertFacilitySettings(
  data: Partial<InsertFacilitySettings>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getFacilitySettings();
  if (existing) {
    await db
      .update(facilitySettings)
      .set(data)
      .where(eq(facilitySettings.id, existing.id));
  } else {
    await db.insert(facilitySettings).values({
      facilityName: "BestCricketAcademy",
      ...data,
    });
  }
}

// ─── Booking Stats (Admin Dashboard) ─────────────────────────────────────────

export async function getBookingStats() {
  const db = await getDb();
  if (!db) return { pending: 0, confirmed: 0, rejected: 0, cancelled: 0, total: 0 };

  const result = await db
    .select({
      status: bookings.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(bookings)
    .groupBy(bookings.status);

  const stats = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0, total: 0 };
  for (const row of result) {
    stats[row.status] = Number(row.count);
    stats.total += Number(row.count);
  }
  return stats;
}
