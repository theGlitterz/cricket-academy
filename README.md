# BestCricketAcademy — Booking Web App

A mobile-first full-stack web application for a single cricket facility in India. Designed to replace WhatsApp-based booking chaos with a clean, structured booking flow for players and a simple admin panel for the coach.

---

## Overview

**BestCricketAcademy** allows players to:
- Browse 3 services: Ground Booking, Net Practice, Personal Coaching
- Select a date and available time slot
- Submit their name and WhatsApp number
- Pay via UPI (manual QR scan) and upload a payment screenshot
- Track booking status by reference ID or WhatsApp number

The **coach/admin** can:
- Log in and view all bookings
- Review payment screenshots
- Confirm or reject bookings with optional notes
- Manage time slots (create, bulk-create, block/unblock)
- Configure facility settings (UPI ID, QR code, contact info, working hours)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| Database | MySQL / TiDB (via `DATABASE_URL`) |
| File Storage | S3-compatible (via `storagePut` helper) |
| Auth | Manus OAuth (session cookie) |
| Build | Vite 7, esbuild |
| Testing | Vitest |

---

## Project Structure

```
best-cricket-academy/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx              ← Landing page with service cards
│       │   ├── BookingPage.tsx       ← 4-step player booking flow
│       │   ├── BookingStatusPage.tsx ← Track booking by ref or phone
│       │   └── admin/
│       │       ├── AdminLayout.tsx       ← Shared admin shell + nav
│       │       ├── AdminDashboard.tsx    ← Stats + quick actions
│       │       ├── AdminBookings.tsx     ← Booking list with filters
│       │       ├── AdminBookingDetail.tsx← Review + confirm/reject
│       │       ├── AdminSlots.tsx        ← Slot management
│       │       └── AdminSettings.tsx     ← Facility + UPI settings
│       ├── App.tsx                   ← Route definitions
│       └── index.css                 ← Cricket-inspired theme tokens
├── server/
│   ├── routers.ts                    ← tRPC router (bookings, slots, services, settings)
│   ├── db.ts                         ← Drizzle query helpers
│   ├── seed.ts                       ← Default services + settings seed
│   ├── bookings.test.ts              ← Vitest tests for booking procedures
│   └── auth.logout.test.ts           ← Auth test (template)
├── drizzle/
│   └── schema.ts                     ← 5 tables: users, services, slots, bookings, facilitySettings
├── shared/
│   ├── const.ts                      ← Cookie name, shared constants
│   └── cricket.ts                    ← Cricket-specific constants (service slugs, statuses)
└── .env.example                      ← Environment variable template
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Admin/coach accounts (Manus OAuth) |
| `services` | Ground Booking, Net Practice, Personal Coaching |
| `slots` | Time slots per service per date |
| `bookings` | Player booking records with status lifecycle |
| `facilitySettings` | UPI ID, QR code URL, contact info, working hours |

### Booking Status Lifecycle

```
pending → confirmed
pending → rejected
confirmed → cancelled
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |
| `OWNER_OPEN_ID` | Owner's Manus OpenID (auto-promoted to admin) |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API base URL |
| `BUILT_IN_FORGE_API_KEY` | Server-side Manus API key |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Manus API key |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend Manus API URL |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server (frontend + backend together)
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check

# Seed default services and facility settings
npx tsx server/seed.ts

# Generate + apply DB migrations after schema changes
pnpm db:push
```

---

## Admin Setup

1. Sign in via the admin panel at `/admin`
2. Your account is automatically promoted to **admin** if your `OWNER_OPEN_ID` matches
3. Go to **Settings** and configure:
   - Facility name, address, WhatsApp contact
   - UPI ID and QR code image
   - Working hours
4. Go to **Slots** and create time slots for each service
   - Use **Bulk Create** to generate a standard 10-slot/day schedule for multiple days
5. Share the booking link `/book` with players (works great from WhatsApp)

---

## Deployment

This app is designed for deployment on **Manus** (built-in hosting with custom domains).

To deploy:
1. Save a checkpoint in the Manus UI
2. Click the **Publish** button

For external deployment (Vercel, Railway, etc.):
- Build: `pnpm build`
- Start: `node dist/index.js`
- Set all environment variables in your hosting provider

---

## V1 Scope & Constraints

- Single facility only (BestCricketAcademy)
- Manual UPI payment — no automatic verification
- Coach manually confirms bookings after reviewing screenshot
- No SMS/email notifications in V1 (WhatsApp-based communication)
- Mobile-first design, optimized for sharing via WhatsApp links

---

## Future Roadmap (Post-V1)

- WhatsApp Business API integration for automated confirmations
- Razorpay/Stripe payment gateway
- Recurring slot subscriptions
- Player profiles and booking history
- Automated slot reminders
- Multi-facility support
