import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useLocation, useParams } from "wouter";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  CheckCircle2,
  Upload,
  Copy,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "service" | "slot" | "details" | "payment" | "done";

interface BookingState {
  serviceId?: number;
  serviceSlug?: string;
  serviceName?: string;
  servicePrice?: string;
  slotId?: number;
  slotDate?: string;
  slotStart?: string;
  slotEnd?: string;
  playerName?: string;
  playerWhatsApp?: string;
  bookingId?: number;
  referenceId?: string;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "service", label: "Service" },
  { id: "slot", label: "Slot" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < idx
                ? "bg-primary text-primary-foreground"
                : i === idx
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < idx ? "✓" : i + 1}
          </div>
          <span
            className={`text-xs ${
              i === idx ? "text-primary font-medium" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Service Selection ────────────────────────────────────────────────

function ServiceStep({
  initialSlug,
  onSelect,
}: {
  initialSlug?: string;
  onSelect: (service: { id: number; slug: string; name: string; price: string }) => void;
}) {
  const { data: services, isLoading } = trpc.services.list.useQuery();

  const emojiMap: Record<string, string> = {
    "ground-booking": "🏏",
    "net-practice": "🎯",
    "personal-coaching": "👨‍🏫",
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Select a Service
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          What type of session are you booking?
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {services?.map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer border transition-all active:scale-[0.98] ${
                initialSlug === service.slug
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() =>
                onSelect({
                  id: service.id,
                  slug: service.slug,
                  name: service.name,
                  price: service.pricePerSlot,
                })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emojiMap[service.slug] ?? "🏏"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {service.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary text-sm">
                      ₹{parseFloat(service.pricePerSlot).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground">{service.durationMinutes} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Date & Slot Selection ────────────────────────────────────────────

function SlotStep({
  serviceId,
  onSelect,
}: {
  serviceId: number;
  onSelect: (slot: { id: number; date: string; start: string; end: string }) => void;
}) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().slice(0, 10)
  );

  const { data: slots, isLoading } = trpc.slots.getAvailable.useQuery({
    serviceId,
    date: selectedDate,
  });

  // Generate next 14 days for date picker
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Pick a Date & Slot
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select your preferred date and available time slot
        </p>
      </div>

      {/* Date Scroller */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {dates.map((date) => {
          const { day, date: d, month } = formatDate(date);
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`shrink-0 w-14 rounded-xl py-2 flex flex-col items-center gap-0.5 border transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:border-primary/40"
              }`}
            >
              <span className="text-xs opacity-70">{day}</span>
              <span className="text-base font-bold leading-none">{d}</span>
              <span className="text-xs opacity-70">{month}</span>
            </button>
          );
        })}
      </div>

      {/* Slots */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">
          Available Slots —{" "}
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() =>
                  onSelect({
                    id: slot.id,
                    date: selectedDate,
                    start: slot.startTime,
                    end: slot.endTime,
                  })
                }
                className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] transition-all"
              >
                <p className="font-semibold text-sm text-foreground">
                  {slot.startTime} – {slot.endTime}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {slot.maxCapacity - slot.bookedCount} spot
                  {slot.maxCapacity - slot.bookedCount !== 1 ? "s" : ""} left
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No slots available on this date.</p>
            <p className="text-xs mt-1">Try a different date.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Player Details ───────────────────────────────────────────────────

function DetailsStep({
  booking,
  onSubmit,
  isLoading,
}: {
  booking: BookingState;
  onSubmit: (name: string, whatsApp: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter your name");
    if (phone.replace(/\D/g, "").length < 10)
      return toast.error("Please enter a valid WhatsApp number");
    onSubmit(name.trim(), phone.trim());
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Your Details
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          We'll send your booking confirmation to WhatsApp
        </p>
      </div>

      {/* Booking Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Booking Summary</p>
        <p className="text-sm font-semibold text-foreground">{booking.serviceName}</p>
        <p className="text-sm text-muted-foreground">
          {booking.slotDate &&
            new Date(booking.slotDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </p>
        <p className="text-sm text-muted-foreground">
          {booking.slotStart} – {booking.slotEnd}
        </p>
        <div className="pt-1 border-t border-primary/20">
          <p className="text-base font-bold text-primary">
            ₹{parseFloat(booking.servicePrice ?? "0").toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">WhatsApp Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <p className="text-xs text-muted-foreground">
            Include country code, e.g. +91 for India
          </p>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Booking...
            </>
          ) : (
            "Confirm & Proceed to Payment"
          )}
        </Button>
      </form>
    </div>
  );
}

// ─── Step 4: Payment ──────────────────────────────────────────────────────────

function PaymentStep({
  booking,
  onPaymentUploaded,
}: {
  booking: BookingState;
  onPaymentUploaded: () => void;
}) {
  const { data: settings } = trpc.settings.get.useQuery();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.bookings.uploadPayment.useMutation({
    onSuccess: () => {
      setUploaded(true);
      toast.success("Payment screenshot uploaded!");
      setTimeout(onPaymentUploaded, 1200);
    },
    onError: (err) => {
      toast.error(err.message);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !booking.bookingId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        bookingId: booking.bookingId!,
        imageBase64: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const copyUpi = () => {
    if (settings?.upiId) {
      navigator.clipboard.writeText(settings.upiId);
      toast.success("UPI ID copied!");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Complete Payment
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pay via UPI and upload your screenshot
        </p>
      </div>

      {/* Amount */}
      <div className="bg-primary text-primary-foreground rounded-xl p-4 text-center">
        <p className="text-sm opacity-80">Amount to Pay</p>
        <p className="text-3xl font-bold mt-1">
          ₹{parseFloat(booking.servicePrice ?? "0").toLocaleString("en-IN")}
        </p>
        <p className="text-xs opacity-70 mt-1">
          Ref: {booking.referenceId}
        </p>
      </div>

      {/* UPI QR */}
      {settings?.upiQrCodeUrl ? (
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">Scan QR Code to Pay</p>
          <img
            src={settings.upiQrCodeUrl}
            alt="UPI QR Code"
            className="w-48 h-48 mx-auto rounded-lg object-contain"
          />
          {settings.upiId && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-mono text-foreground">{settings.upiId}</span>
              <button onClick={copyUpi} className="text-primary hover:text-primary/80">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : settings?.upiId ? (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Pay via UPI ID</p>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <span className="text-sm font-mono flex-1 text-foreground">{settings.upiId}</span>
            <button onClick={copyUpi} className="text-primary hover:text-primary/80">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Payment details will be shared by the coach on WhatsApp.
          </p>
        </div>
      )}

      {/* Instructions */}
      {settings?.paymentInstructions && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          ℹ️ {settings.paymentInstructions}
        </p>
      )}

      {/* Upload */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Upload Payment Screenshot
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || uploaded}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : uploaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Screenshot Uploaded
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Screenshot
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG up to 5MB
        </p>
      </div>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────

function DoneStep({ booking }: { booking: BookingState }) {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h2
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Booking Submitted!
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your booking is pending coach confirmation.
        </p>
      </div>

      <div className="bg-muted rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Booking Reference
        </p>
        <p className="text-lg font-bold text-primary font-mono">{booking.referenceId}</p>
        <p className="text-xs text-muted-foreground">
          Save this reference to track your booking status
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
        <p className="text-sm font-semibold text-yellow-800">What happens next?</p>
        <ul className="text-xs text-yellow-700 mt-2 space-y-1">
          <li>• The coach will review your payment screenshot</li>
          <li>• You'll receive confirmation on WhatsApp</li>
          <li>• Booking is confirmed once the coach approves</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Link href={`/booking/${booking.referenceId}`}>
          <Button className="w-full">Track Booking Status</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="w-full">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main BookingPage ─────────────────────────────────────────────────────────

export default function BookingPage() {
  const params = useParams<{ serviceSlug?: string }>();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>(
    params.serviceSlug ? "slot" : "service"
  );
  const [booking, setBooking] = useState<BookingState>({
    serviceSlug: params.serviceSlug,
  });

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      setBooking((prev) => ({
        ...prev,
        bookingId: data.id,
        referenceId: data.referenceId,
      }));
      setStep("payment");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // If serviceSlug is in URL, pre-load the service
  const { data: services } = trpc.services.list.useQuery();
  const preloadedService = services?.find((s) => s.slug === params.serviceSlug);

  // Sync preloaded service into state once
  if (preloadedService && !booking.serviceId) {
    setBooking({
      serviceId: preloadedService.id,
      serviceSlug: preloadedService.slug,
      serviceName: preloadedService.name,
      servicePrice: preloadedService.pricePerSlot,
    });
  }

  const goBack = () => {
    const order: Step[] = ["service", "slot", "details", "payment", "done"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center gap-3 h-14">
          <button
            onClick={goBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Book a Session</p>
            {step !== "done" && <StepIndicator current={step} />}
          </div>
          <Link href="/">
            <span className="text-lg">🏏</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container py-6 max-w-lg mx-auto">
        {step === "service" && (
          <ServiceStep
            initialSlug={booking.serviceSlug}
            onSelect={(service) => {
              setBooking({
                serviceId: service.id,
                serviceSlug: service.slug,
                serviceName: service.name,
                servicePrice: service.price,
              });
              setStep("slot");
            }}
          />
        )}

        {step === "slot" && booking.serviceId && (
          <SlotStep
            serviceId={booking.serviceId}
            onSelect={(slot) => {
              setBooking((prev) => ({
                ...prev,
                slotId: slot.id,
                slotDate: slot.date,
                slotStart: slot.start,
                slotEnd: slot.end,
              }));
              setStep("details");
            }}
          />
        )}

        {step === "details" && (
          <DetailsStep
            booking={booking}
            isLoading={createBookingMutation.isPending}
            onSubmit={(name, whatsApp) => {
              setBooking((prev) => ({
                ...prev,
                playerName: name,
                playerWhatsApp: whatsApp,
              }));
              createBookingMutation.mutate({
                slotId: booking.slotId!,
                serviceId: booking.serviceId!,
                playerName: name,
                playerWhatsApp: whatsApp,
              });
            }}
          />
        )}

        {step === "payment" && (
          <PaymentStep
            booking={booking}
            onPaymentUploaded={() => setStep("done")}
          />
        )}

        {step === "done" && <DoneStep booking={booking} />}
      </main>
    </div>
  );
}
