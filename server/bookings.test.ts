import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────

vi.mock("./db", async () => {
  const mockSlot = {
    id: 1,
    serviceId: 1,
    date: "2025-01-15",
    startTime: "09:00",
    endTime: "10:00",
    bookedCount: 0,
    maxCapacity: 2,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    id: 1,
    slug: "net-practice",
    name: "Net Practice",
    description: "Net lane booking",
    pricePerSlot: "500.00",
    durationMinutes: 60,
    maxCapacity: 2,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBooking = {
    id: 42,
    referenceId: "BCA-20250115-1234",
    slotId: 1,
    serviceId: 1,
    playerName: "Test Player",
    playerWhatsApp: "+919876543210",
    playerEmail: null,
    amountPaid: "500.00",
    status: "pending" as const,
    paymentScreenshotUrl: null,
    adminNote: null,
    reviewedAt: null,
    reviewedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    getSlotById: vi.fn().mockResolvedValue(mockSlot),
    getActiveServices: vi.fn().mockResolvedValue([mockService]),
    generateReferenceId: vi.fn().mockReturnValue("BCA-20250115-1234"),
    createBooking: vi.fn().mockResolvedValue(42),
    incrementSlotBookedCount: vi.fn().mockResolvedValue(undefined),
    decrementSlotBookedCount: vi.fn().mockResolvedValue(undefined),
    getBookingById: vi.fn().mockResolvedValue(mockBooking),
    confirmBooking: vi.fn().mockResolvedValue(undefined),
    rejectBooking: vi.fn().mockResolvedValue(undefined),
    cancelBooking: vi.fn().mockResolvedValue(undefined),
    getAllBookings: vi.fn().mockResolvedValue([mockBooking]),
    getBookingStats: vi.fn().mockResolvedValue({ pending: 1, confirmed: 0, rejected: 0, cancelled: 0, total: 1 }),
    getBookingByReference: vi.fn().mockResolvedValue(mockBooking),
    getBookingsByWhatsApp: vi.fn().mockResolvedValue([mockBooking]),
    updateBookingPaymentScreenshot: vi.fn().mockResolvedValue(undefined),
    getServiceBySlug: vi.fn().mockResolvedValue(mockService),
    getAllServices: vi.fn().mockResolvedValue([mockService]),
    upsertService: vi.fn().mockResolvedValue(undefined),
    getAvailableSlots: vi.fn().mockResolvedValue([mockSlot]),
    getSlotsForDateRange: vi.fn().mockResolvedValue([mockSlot]),
    createSlot: vi.fn().mockResolvedValue(1),
    updateSlotBlockStatus: vi.fn().mockResolvedValue(undefined),
    getFacilitySettings: vi.fn().mockResolvedValue(null),
    upsertFacilitySettings: vi.fn().mockResolvedValue(undefined),
    upsertUser: vi.fn().mockResolvedValue(undefined),
    getUserByOpenId: vi.fn().mockResolvedValue(null),
  };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test.jpg" }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Coach Admin",
      email: "admin@bca.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      name: "Regular User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("bookings.create", () => {
  it("creates a booking for a valid slot and service", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.bookings.create({
      slotId: 1,
      serviceId: 1,
      playerName: "Rahul Sharma",
      playerWhatsApp: "+919876543210",
    });
    expect(result.id).toBe(42);
    expect(result.referenceId).toBe("BCA-20250115-1234");
  });

  it("rejects booking when player name is empty", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.bookings.create({
        slotId: 1,
        serviceId: 1,
        playerName: "",
        playerWhatsApp: "+919876543210",
      })
    ).rejects.toThrow();
  });
});

describe("bookings.confirm (admin)", () => {
  it("allows admin to confirm a pending booking", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.bookings.confirm({ id: 42 });
    expect(result.success).toBe(true);
  });

  it("blocks non-admin from confirming a booking", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.bookings.confirm({ id: 42 })).rejects.toThrow("Admin access required");
  });

  it("blocks unauthenticated user from confirming a booking", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bookings.confirm({ id: 42 })).rejects.toThrow();
  });
});

describe("bookings.reject (admin)", () => {
  it("allows admin to reject a pending booking with a note", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.bookings.reject({
      id: 42,
      adminNote: "Payment screenshot unclear",
    });
    expect(result.success).toBe(true);
  });
});

describe("bookings.stats (admin)", () => {
  it("returns booking statistics for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const stats = await caller.bookings.stats();
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.confirmed).toBe("number");
  });
});

describe("services.list (public)", () => {
  it("returns active services", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.services.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("slots.getAvailable (public)", () => {
  it("returns available slots for a service and date", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.slots.getAvailable({
      serviceId: 1,
      date: "2025-01-15",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("settings.get (public)", () => {
  it("returns facility settings", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.settings.get();
    // May be null if not seeded in test env
    expect(result === null || typeof result === "object").toBe(true);
  });
});
