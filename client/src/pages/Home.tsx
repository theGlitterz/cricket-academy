import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Shield,
} from "lucide-react";

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  slug,
  name,
  description,
  price,
  duration,
}: {
  slug: string;
  name: string;
  description: string | null;
  price: string;
  duration: number;
}) {
  const emojiMap: Record<string, string> = {
    "ground-booking": "🏏",
    "net-practice": "🎯",
    "personal-coaching": "👨‍🏫",
  };
  const emoji = emojiMap[slug] ?? "🏏";
  const priceNum = parseFloat(price);

  return (
    <Link href={`/book/${slug}`}>
      <Card className="group cursor-pointer border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 active:scale-[0.98]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground text-base leading-tight">{name}</h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="secondary" className="text-xs font-semibold">
                  ₹{priceNum.toLocaleString("en-IN")} / slot
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {duration} min
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── How It Works Step ────────────────────────────────────────────────────────

function HowItWorksStep({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: services, isLoading } = trpc.services.list.useQuery();
  const { data: settings } = trpc.facility.get.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <span
              className="font-bold text-primary text-base"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              BestCricketAcademy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/booking/status">
              <Button variant="ghost" size="sm" className="text-xs">
                My Bookings
              </Button>
            </Link>
            <Link href="/book">
              <Button size="sm" className="text-xs">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero-gradient text-white relative overflow-hidden">
        {/* Subtle pitch lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.15) 40px, rgba(255,255,255,0.15) 41px)"
          }} />
        </div>
        <div className="container relative py-10 pb-12">
          <div className="max-w-lg">
            <Badge className="bg-white/20 text-white border-white/30 text-xs mb-3 hover:bg-white/20">
              📍 {settings?.address ?? "India's Premier Cricket Facility"}
            </Badge>
            <h1
              className="text-3xl font-bold text-white leading-tight mb-3"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Book Your Cricket
              <br />
              <span className="text-yellow-300">Session Online</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Ground booking, net practice, and personal coaching — all in one place.
              No more WhatsApp back-and-forth.
            </p>
            <div className="flex gap-3">
              <Link href="/book">
                <Button
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold shadow-lg"
                >
                  Book a Session
                </Button>
              </Link>
              <Link href="/booking/status">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white bg-white/10 hover:bg-white/20"
                >
                  Track Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Info Strip ── */}
      {settings && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="container py-3">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {settings.workingHours && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {settings.workingHours}
                </span>
              )}
              {settings.coachWhatsApp && (
                <a
                  href={`https://wa.me/${settings.coachWhatsApp.replace(/\D/g, "")}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {settings.coachWhatsApp}
                </a>
              )}
              {settings.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {settings.address}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Services ── */}
      <section className="container py-8">
        <div className="mb-5">
          <h2
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Choose a Service
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select the type of session you want to book
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : services && services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                slug={service.slug}
                name={service.name}
                description={service.description}
                price={service.price}
                duration={service.durationMinutes}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Services will be available soon.</p>
            <p className="text-xs mt-1">
              Contact us on WhatsApp in the meantime.
            </p>
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="container py-6 pb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2
            className="text-base font-bold text-foreground mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            How Booking Works
          </h2>
          <div className="space-y-4">
            <HowItWorksStep
              step={1}
              title="Select a service & slot"
              desc="Choose your preferred service, date, and available time slot."
            />
            <HowItWorksStep
              step={2}
              title="Enter your details"
              desc="Provide your name and WhatsApp number for confirmation."
            />
            <HowItWorksStep
              step={3}
              title="Pay via UPI"
              desc="Scan the QR code or use the UPI ID to complete payment."
            />
            <HowItWorksStep
              step={4}
              title="Upload screenshot"
              desc="Upload your payment screenshot for the coach to verify."
            />
            <HowItWorksStep
              step={5}
              title="Get confirmed"
              desc="Coach reviews and confirms your booking. You're all set!"
            />
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="container pb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <CheckCircle2 className="w-5 h-5 text-primary" />, label: "Instant Booking" },
            { icon: <Shield className="w-5 h-5 text-primary" />, label: "Secure Payment" },
            { icon: <Phone className="w-5 h-5 text-primary" />, label: "WhatsApp Support" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 bg-card rounded-xl border border-border p-3 text-center"
            >
              {icon}
              <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        <div className="container py-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏏</span>
              <span
                className="font-bold text-primary text-sm"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                BestCricketAcademy
              </span>
            </div>
            {settings?.address && (
              <p className="text-xs text-muted-foreground">{settings.address}</p>
            )}
            {settings?.coachWhatsApp && (
              <a
                href={`https://wa.me/${settings.coachWhatsApp.replace(/\D/g, "")}`}
                className="text-xs text-primary"
              >
                WhatsApp: {settings.coachWhatsApp}
              </a>
            )}
            <div className="flex gap-4 pt-1">
              <Link href="/admin">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Admin Login
                </span>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} BestCricketAcademy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
