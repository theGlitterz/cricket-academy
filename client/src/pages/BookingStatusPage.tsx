import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  Search,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
} from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "Pending Review",
    icon: <AlertCircle className="w-4 h-4" />,
    className: "status-pending",
  },
  confirmed: {
    label: "Confirmed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: "status-confirmed",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
    className: "status-rejected",
  },
  cancelled: {
    label: "Cancelled",
    icon: <MinusCircle className="w-4 h-4" />,
    className: "status-cancelled",
  },
};

function BookingCard({ booking }: { booking: {
  id: number;
  referenceId: string;
  playerName: string;
  bookingStatus: BookingStatus;
  amount: string;
  adminNote: string | null;
  createdAt: Date;
  slotId: number;
  serviceId: number;
} }) {
  const config = STATUS_CONFIG[booking.bookingStatus];
  return (
    <Card className="border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm font-bold text-primary">{booking.referenceId}</p>
            <p className="text-sm text-foreground mt-0.5">{booking.playerName}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
            {config.icon}
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {new Date(booking.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="font-semibold text-foreground">
            ₹{parseFloat(String(booking.amount)).toLocaleString("en-IN")}
          </span>
        </div>

        {booking.adminNote && (
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Coach note:</span> {booking.adminNote}
            </p>
          </div>
        )}

        {booking.bookingStatus === "pending" && (
          <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            ⏳ Your booking is being reviewed. You'll be notified on WhatsApp once confirmed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BookingStatusPage() {
  const params = useParams<{ referenceId?: string }>();
  const [searchRef, setSearchRef] = useState(params.referenceId ?? "");
  const [searchPhone, setSearchPhone] = useState("");
  const [activeSearch, setActiveSearch] = useState<
    { type: "ref"; value: string } | { type: "phone"; value: string } | null
  >(params.referenceId ? { type: "ref", value: params.referenceId } : null);

  const { data: bookingByRef, isLoading: loadingRef } =
    trpc.bookings.getByReference.useQuery(
      { referenceId: activeSearch?.type === "ref" ? activeSearch.value : "" },
      { enabled: activeSearch?.type === "ref" && !!activeSearch.value }
    );

  const { data: bookingsByPhone, isLoading: loadingPhone } =
    trpc.bookings.getByWhatsApp.useQuery(
      { playerWhatsApp: activeSearch?.type === "phone" ? activeSearch.value : "" },
      { enabled: activeSearch?.type === "phone" && !!activeSearch.value }
    );

  const isLoading = loadingRef || loadingPhone;

  const handleRefSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) setActiveSearch({ type: "ref", value: searchRef.trim() });
  };

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPhone.trim()) setActiveSearch({ type: "phone", value: searchPhone.trim() });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center gap-3 h-14">
          <Link href="/">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <p className="text-sm font-semibold text-foreground flex-1">Track Booking</p>
          <span className="text-lg">🏏</span>
        </div>
      </header>

      <main className="container py-6 max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            Booking Status
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Look up your booking by reference ID or WhatsApp number
          </p>
        </div>

        {/* Search by Reference */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Search by Reference ID
            </p>
            <form onSubmit={handleRefSearch} className="flex gap-2">
              <Input
                placeholder="e.g. BCA-20240409-1234"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="font-mono text-sm"
              />
              <Button type="submit" size="sm" disabled={!searchRef.trim()}>
                Find
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search by Phone */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Search by WhatsApp Number
            </p>
            <form onSubmit={handlePhoneSearch} className="flex gap-2">
              <Input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!searchPhone.trim()}>
                Find
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {activeSearch?.type === "ref" && !isLoading && (
          <>
            {bookingByRef ? (
              <BookingCard booking={bookingByRef as Parameters<typeof BookingCard>[0]["booking"]} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No booking found for this reference ID.</p>
              </div>
            )}
          </>
        )}

        {activeSearch?.type === "phone" && !isLoading && (
          <>
            {bookingsByPhone && bookingsByPhone.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Found {bookingsByPhone.length} booking{bookingsByPhone.length !== 1 ? "s" : ""}
                </p>
                {bookingsByPhone.map((b) => (
                  <BookingCard key={b.id} booking={b as Parameters<typeof BookingCard>[0]["booking"]} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No bookings found for this number.</p>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="text-center pt-2">
          <Link href="/book">
            <Button className="w-full">Book a New Session</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
