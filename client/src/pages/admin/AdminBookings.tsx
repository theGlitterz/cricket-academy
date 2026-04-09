import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { ChevronRight, CalendarDays, Search } from "lucide-react";
import AdminLayout from "./AdminLayout";

type StatusFilter = "all" | "pending" | "confirmed" | "rejected" | "cancelled";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_CSS: Record<string, string> = {
  pending: "status-pending",
  confirmed: "status-confirmed",
  rejected: "status-rejected",
  cancelled: "status-cancelled",
};

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: bookings, isLoading } = trpc.bookings.adminList.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  return (
    <AdminLayout title="Bookings">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Bookings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and manage all booking requests
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-4 px-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/admin/bookings/${booking.id}`}>
              <Card className="border border-border hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.98]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {booking.playerName}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_CSS[booking.bookingStatus] ?? ""}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {booking.referenceId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <p className="text-sm font-bold text-primary">
                        ₹{parseFloat(String(booking.amount)).toLocaleString("en-IN")}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No bookings found.</p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-xs text-primary mt-2"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
