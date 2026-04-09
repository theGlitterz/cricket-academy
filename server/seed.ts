/**
 * Seed script — run once to populate default services and facility settings.
 * Usage: npx tsx server/seed.ts
 */
import { getDb } from "./db";
import { facilitySettings, services } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const DEFAULT_SERVICES = [
  {
    slug: "ground-booking",
    name: "Ground Booking",
    description:
      "Book the full cricket ground for your team practice, match simulation, or training camp. Includes pitch and outfield.",
    pricePerSlot: "1500.00",
    durationMinutes: 120,
    maxCapacity: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    slug: "net-practice",
    name: "Net Practice",
    description:
      "Reserve a dedicated net lane for focused batting or bowling drills. Ideal for individual or small group training.",
    pricePerSlot: "500.00",
    durationMinutes: 60,
    maxCapacity: 2,
    isActive: true,
    sortOrder: 2,
  },
  {
    slug: "personal-coaching",
    name: "Personal Coaching",
    description:
      "One-on-one coaching session with our certified coach. Tailored feedback on technique, fitness, and game strategy.",
    pricePerSlot: "800.00",
    durationMinutes: 60,
    maxCapacity: 1,
    isActive: true,
    sortOrder: 3,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");
  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available. Check DATABASE_URL.");
    process.exit(1);
  }

  // Seed services
  for (const service of DEFAULT_SERVICES) {
    const existing = await db
      .select()
      .from(services)
      .where(eq(services.slug, service.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(services).values(service);
      console.log(`✅ Created service: ${service.name}`);
    } else {
      console.log(`⏭️  Service already exists: ${service.name}`);
    }
  }

  // Seed facility settings
  const existingSettings = await db.select().from(facilitySettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(facilitySettings).values({
      facilityName: "BestCricketAcademy",
      address: "Cricket Ground, Your City, India",
      contactWhatsApp: "+919876543210",
      upiId: "coach@upi",
      paymentInstructions:
        "Pay the exact amount via UPI and upload the payment screenshot to confirm your booking.",
      workingHours: "6:00 AM – 9:00 PM",
    });
    console.log("✅ Created facility settings");
  } else {
    console.log("⏭️  Facility settings already exist");
  }

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
