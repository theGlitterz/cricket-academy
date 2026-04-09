import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  User,
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const STATUS_CSS: Record<string, string> = {
  pending: "status-pending",
  confirmed: "status-confirmed",
  rejected: "status-rejected",
  cancelled: "status-cancelled",
};

export default function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const bookingId = parseInt(id ?? "0", 10);
  const [adminNote, setAdminNote] = useState("");
  const utils = trpc.useUtils();

  const { data: booking, isLoading } = trpc.bookings.getByReference.useQuery(
    { referenceId: "" },
    { enabled: false }
  );

  // We use adminList and filter by id since we don't have a getById public procedure
  const { data: allBookings, isLoading: loadingAll } = trpc.bookings.adminList.useQuery({});
  const currentBooking = allBookings?.find((b) => b.id === bookingId);

  const confirmMutation = trpc.bookings.confirm.useMutation({
    onSuccess: () => {
      toast.success("Booking confirmed!");
      utils.bookings.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.bookings.reject.useMutation({
    onSuccess: () => {
      toast.success("Booking rejected.");
      utils.bookings.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled.");
      utils.bookings.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loadingAll) {
    return (
      <AdminLayout title="Booking Detail">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!currentBooking) {
    return (
      <AdminLayout title="Booking Detail">
        <div className="text-center py-12 text-muted-foreground">
          <XCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Booking not found.</p>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm" className="mt-4">
              ← Back to Bookings
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const b = currentBooking;
  const isPending = b.bookingStatus === "pending";
  const isProcessing =
    confirmMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  return (
    <AdminLayout title="Booking Detail">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/bookings">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            Booking Detail
          </h1>
          <p className="text-xs text-muted-foreground font-mono">{b.referenceId}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CSS[b.bookingStatus] ?? ""}`}>
          {b.bookingStatus}
        </span>
      </div>

      {/* Player Info */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Player Information
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{b.playerName}</p>
              <a
                href={`https://wa.me/${b.playerWhatsApp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                {b.playerWhatsApp}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Info */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Booking Details
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-base font-bold text-primary">
                ₹{parseFloat(String(b.amount)).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(b.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Screenshot */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Payment Screenshot
          </p>
          {b.screenshotUrl ? (
            <div className="space-y-2">
              <img
                src={b.screenshotUrl}
                alt="Payment screenshot"
                className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted"
              />
              <a
                href={b.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Open full size
              </a>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No screenshot uploaded yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Note */}
      {b.adminNote && (
        <Card className="border border-border mb-4">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Admin Note
            </p>
            <p className="text-sm text-foreground">{b.adminNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {isPending && (
        <Card className="border border-border">
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Review Booking
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note for the player..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={isProcessing}
                onClick={() =>
                  confirmMutation.mutate({ id: b.id, adminNote: adminNote || undefined })
                }
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Confirm
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                disabled={isProcessing}
                onClick={() =>
                  rejectMutation.mutate({ id: b.id, adminNote: adminNote || undefined })
                }
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1.5" />
                )}
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {b.bookingStatus === "confirmed" && (
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
          disabled={isProcessing}
          onClick={() => cancelMutation.mutate({ id: b.id })}
        >
          {cancelMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : null}
          Cancel Booking
        </Button>
      )}
    </AdminLayout>
  );
}
