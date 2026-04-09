# BestCricketAcademy — Project TODO

## Prompt 1 of 5: Master Setup & Product Foundation

### Database Schema
- [x] Define `services` table (Ground Booking, Net Practice, Personal Coaching)
- [x] Define `slots` table (date, time, service, capacity, is_blocked)
- [x] Define `bookings` table (player info, slot, status, payment screenshot)
- [x] Define `facility_settings` table (UPI ID, QR code URL, facility name, contact)
- [x] Apply all migrations via drizzle-kit migrate

### Server / tRPC Routers
- [x] `services.list` — public, list all active services with pricing
- [x] `services.listAll` — admin, list all services including inactive
- [x] `slots.getAvailable` — public, get available slots for a service+date
- [x] `slots.getForRange` — admin, get slots for a date range
- [x] `slots.create` — admin, create a single slot
- [x] `slots.createBulk` — admin, bulk create standard schedule
- [x] `slots.setBlocked` — admin, block/unblock a slot
- [x] `bookings.create` — public, create a new booking request (pending)
- [x] `bookings.uploadPayment` — public, upload payment screenshot to S3
- [x] `bookings.getByReference` — public, get booking by reference ID
- [x] `bookings.getByWhatsApp` — public, get bookings by player WhatsApp
- [x] `bookings.adminList` — admin, list all bookings with status filter
- [x] `bookings.confirm` — admin, confirm a booking
- [x] `bookings.reject` — admin, reject a booking with optional note
- [x] `bookings.cancel` — admin, cancel a confirmed booking
- [x] `bookings.stats` — admin, booking stats (pending/confirmed/rejected/total)
- [x] `settings.get` — public, get facility settings
- [x] `settings.update` — admin, update facility settings
- [x] `settings.uploadQrCode` — admin, upload UPI QR code to S3

### UI — Player Side
- [x] Landing page with facility intro and 3 service cards (CTA to book)
- [x] BookingPage: 4-step flow (service → slot → details → payment → done)
- [x] Step indicator component
- [x] Date scroller (14-day picker)
- [x] Available slot grid with capacity display
- [x] Player details form (name, WhatsApp number)
- [x] Payment step: UPI QR display, UPI ID copy, screenshot upload
- [x] Done step with reference ID and status tracking link
- [x] BookingStatusPage: search by reference ID or WhatsApp number

### UI — Admin Side
- [x] AdminLayout: shared shell with sidebar nav (mobile hamburger + desktop sidebar)
- [x] AdminDashboard: stats cards, quick actions, pending bookings preview
- [x] AdminBookings: list with status filter tabs
- [x] AdminBookingDetail: player info, payment screenshot, confirm/reject/cancel actions
- [x] AdminSlots: single slot creation, bulk 10-slot schedule, block/unblock
- [x] AdminSettings: facility info, UPI ID, QR code upload, working hours

### UI — Theme & Layout
- [x] Cricket-inspired color palette (deep green, white, gold accents)
- [x] Mobile-first responsive layout
- [x] Custom global CSS variables and typography (Inter + Syne fonts)
- [x] Status badge CSS classes (pending/confirmed/rejected/cancelled)
- [x] Sidebar navigation for admin side

### Infrastructure & Config
- [x] README.md with setup, architecture, env vars, and deployment notes
- [x] seed.ts script for default services and facility settings
- [x] Vitest tests for core booking procedures (11 tests, all passing)
- [x] Vitest tests for admin confirm/reject/stats procedures

## Prompts 2–5 (Planned — Scope for Future Prompts)
- [x] Prompt 2: Data model, business logic, and booking rules — COMPLETE
- [ ] Prompt 3: Admin dashboard and booking management enhancements
- [ ] Prompt 4: Slot management, settings, and UPI QR improvements
- [ ] Prompt 5: Polish, testing, README, and deployment prep

## Prompt 2 of 5: Data Model, Business Logic & Booking Rules

### Schema Refinements
- [x] Add `facilities` table with id, facility_name, coach_name, coach_whatsapp_number, upi_id, upi_qr_image_url, address, working_hours, payment_instructions
- [x] Update `services` table: add facility_id FK, rename pricePerSlot → price, keep all existing fields
- [x] Update `slots` table: add facility_id FK, replace isBlocked+bookedCount with single availability_status enum (available/booked/blocked)
- [x] Update `bookings` table: add facility_id FK, add payment_status enum (pending_review/confirmed/rejected), rename status → booking_status, add booking_date, start_time, end_time denormalized columns
- [x] Apply migration SQL to database

### Booking Business Rules
- [x] Prevent double-booking: slot availability_status = 'booked' blocks new bookings for same slot
- [x] On booking create: set booking_status=pending, payment_status=pending_review, slot=booked
- [x] On coach confirm: set booking_status=confirmed, payment_status=confirmed, slot stays booked
- [x] On coach reject: set booking_status=rejected, payment_status=rejected, slot reverts to available
- [x] On cancel (confirmed booking): set booking_status=cancelled, slot reverts to available
- [x] Slot availability check before booking creation (race condition guard)

### Seed / Demo Data
- [x] Seed BestCricketAcademy facility record
- [x] Seed 3 services with realistic pricing and durations
- [x] Seed 14 days of time slots (6am–10am, 3pm–9pm) for all 3 services
- [x] Seed sample bookings in all statuses (pending, confirmed, rejected, cancelled)

### DB Helpers & Routers
- [x] Update all DB helpers to use new schema fields
- [x] Update tRPC routers to use facility_id in all queries
- [x] Ensure adminList returns denormalized slot date/time from booking record

### Frontend Updates
- [x] Update BookingPage to use new slot availability_status
- [x] Update AdminBookingDetail to show payment_status separately from booking_status
- [x] Update AdminDashboard stats to reflect new status fields
