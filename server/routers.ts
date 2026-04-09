import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  createSlot,
  decrementSlotBookedCount,
  generateReferenceId,
  getActiveServices,
  getAllBookings,
  getAllServices,
  getAvailableSlots,
  getBookingById,
  getBookingByReference,
  getBookingsByWhatsApp,
  getBookingStats,
  getFacilitySettings,
  getServiceBySlug,
  getSlotById,
  getSlotsForDateRange,
  incrementSlotBookedCount,
  rejectBooking,
  updateBookingPaymentScreenshot,
  updateSlotBlockStatus,
  upsertFacilitySettings,
  upsertService,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

// ─── Admin guard middleware ───────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Services router ──────────────────────────────────────────────────────────

const servicesRouter = router({
  list: publicProcedure.query(() => getActiveServices()),

  listAll: adminProcedure.query(() => getAllServices()),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getServiceBySlug(input.slug)),

  upsert: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        pricePerSlot: z.string(), // decimal as string
        durationMinutes: z.number().int().positive(),
        maxCapacity: z.number().int().positive(),
        isActive: z.boolean(),
        sortOrder: z.number().int(),
      })
    )
    .mutation(async ({ input }) => {
      await upsertService(input as Parameters<typeof upsertService>[0]);
      return { success: true };
    }),
});

// ─── Slots router ─────────────────────────────────────────────────────────────

const slotsRouter = router({
  getAvailable: publicProcedure
    .input(z.object({ serviceId: z.number().int(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(({ input }) => getAvailableSlots(input.serviceId, input.date)),

  getForRange: adminProcedure
    .input(
      z.object({
        serviceId: z.number().int(),
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(({ input }) =>
      getSlotsForDateRange(input.serviceId, input.fromDate, input.toDate)
    ),

  create: adminProcedure
    .input(
      z.object({
        serviceId: z.number().int(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        maxCapacity: z.number().int().positive().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createSlot(input);
      return { id };
    }),

  /** Create multiple slots in bulk (e.g., generate a week of slots) */
  createBulk: adminProcedure
    .input(
      z.object({
        serviceId: z.number().int(),
        dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        timeSlots: z.array(
          z.object({
            startTime: z.string().regex(/^\d{2}:\d{2}$/),
            endTime: z.string().regex(/^\d{2}:\d{2}$/),
          })
        ),
        maxCapacity: z.number().int().positive().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const created: number[] = [];
      for (const date of input.dates) {
        for (const time of input.timeSlots) {
          const id = await createSlot({
            serviceId: input.serviceId,
            date,
            startTime: time.startTime,
            endTime: time.endTime,
            maxCapacity: input.maxCapacity,
          });
          created.push(id);
        }
      }
      return { count: created.length, ids: created };
    }),

  setBlocked: adminProcedure
    .input(z.object({ id: z.number().int(), isBlocked: z.boolean() }))
    .mutation(async ({ input }) => {
      await updateSlotBlockStatus(input.id, input.isBlocked);
      return { success: true };
    }),
});

// ─── Bookings router ──────────────────────────────────────────────────────────

const bookingsRouter = router({
  /** Player: create a new booking request */
  create: publicProcedure
    .input(
      z.object({
        slotId: z.number().int(),
        serviceId: z.number().int(),
        playerName: z.string().min(1).max(128),
        playerWhatsApp: z.string().min(10).max(20),
        playerEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify slot exists and has capacity
      const slot = await getSlotById(input.slotId);
      if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      if (slot.isBlocked)
        throw new TRPCError({ code: "BAD_REQUEST", message: "This slot is not available" });
      if (slot.bookedCount >= slot.maxCapacity)
        throw new TRPCError({ code: "BAD_REQUEST", message: "This slot is fully booked" });

      // Get service for price
      const allServices = await getActiveServices();
      const service = allServices.find((s) => s.id === input.serviceId);
      if (!service)
        throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });

      const referenceId = generateReferenceId();
      const id = await createBooking({
        referenceId,
        slotId: input.slotId,
        serviceId: input.serviceId,
        playerName: input.playerName,
        playerWhatsApp: input.playerWhatsApp,
        playerEmail: input.playerEmail,
        amountPaid: service.pricePerSlot,
        status: "pending",
      });

      // Reserve the slot
      await incrementSlotBookedCount(input.slotId);

      return { id, referenceId };
    }),

  /** Player: upload payment screenshot (base64 → S3) */
  uploadPayment: publicProcedure
    .input(
      z.object({
        bookingId: z.number().int(),
        /** base64-encoded image data (without data URI prefix) */
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      if (booking.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Booking is no longer pending" });

      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const key = `payments/${booking.referenceId}-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      await updateBookingPaymentScreenshot(booking.id, url);
      return { url };
    }),

  /** Player: look up their bookings by WhatsApp number */
  getByWhatsApp: publicProcedure
    .input(z.object({ whatsApp: z.string().min(10) }))
    .query(({ input }) => getBookingsByWhatsApp(input.whatsApp)),

  /** Player/Admin: get a single booking by reference ID */
  getByReference: publicProcedure
    .input(z.object({ referenceId: z.string() }))
    .query(({ input }) => getBookingByReference(input.referenceId)),

  /** Admin: list all bookings with optional filters */
  adminList: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "confirmed", "rejected", "cancelled"])
          .optional(),
        serviceId: z.number().int().optional(),
      })
    )
    .query(({ input }) => getAllBookings(input)),

  /** Admin: confirm a booking */
  confirm: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      if (booking.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending bookings can be confirmed" });

      await confirmBooking(booking.id, ctx.user.id, input.adminNote);
      return { success: true };
    }),

  /** Admin: reject a booking */
  reject: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      if (booking.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending bookings can be rejected" });

      await rejectBooking(booking.id, ctx.user.id, input.adminNote);
      // Free up the slot
      await decrementSlotBookedCount(booking.slotId);
      return { success: true };
    }),

  /** Admin: cancel a confirmed booking */
  cancel: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });

      await cancelBooking(booking.id);
      if (booking.status === "confirmed" || booking.status === "pending") {
        await decrementSlotBookedCount(booking.slotId);
      }
      return { success: true };
    }),

  /** Admin: dashboard stats */
  stats: adminProcedure.query(() => getBookingStats()),
});

// ─── Facility Settings router ─────────────────────────────────────────────────

const settingsRouter = router({
  get: publicProcedure.query(() => getFacilitySettings()),

  update: adminProcedure
    .input(
      z.object({
        facilityName: z.string().optional(),
        address: z.string().optional(),
        contactWhatsApp: z.string().optional(),
        upiId: z.string().optional(),
        upiQrCodeUrl: z.string().optional(),
        paymentInstructions: z.string().optional(),
        workingHours: z.string().optional(),
        googleMapsUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await upsertFacilitySettings(input);
      return { success: true };
    }),

  /** Admin: upload UPI QR code image */
  uploadQrCode: adminProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/png"),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.mimeType.split("/")[1] ?? "png";
      const key = `settings/upi-qr-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await upsertFacilitySettings({ upiQrCodeUrl: url });
      return { url };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  services: servicesRouter,
  slots: slotsRouter,
  bookings: bookingsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
