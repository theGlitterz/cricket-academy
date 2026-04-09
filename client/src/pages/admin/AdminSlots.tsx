import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Lock, Unlock, Loader2, CalendarDays } from "lucide-react";
import AdminLayout from "./AdminLayout";

// ─── Default time slots ───────────────────────────────────────────────────────

const DEFAULT_TIME_SLOTS = [
  { startTime: "06:00", endTime: "07:00" },
  { startTime: "07:00", endTime: "08:00" },
  { startTime: "08:00", endTime: "09:00" },
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "15:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:00" },
  { startTime: "17:00", endTime: "18:00" },
  { startTime: "18:00", endTime: "19:00" },
  { startTime: "19:00", endTime: "20:00" },
  { startTime: "20:00", endTime: "21:00" },
];

export default function AdminSlots() {
  const { data: services } = trpc.services.listAll.useQuery();
  const utils = trpc.useUtils();

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("07:00");
  const [maxCapacity, setMaxCapacity] = useState("1");
  const [bulkDays, setBulkDays] = useState(7);

  const { data: slots, isLoading: loadingSlots } = trpc.slots.getForRange.useQuery(
    {
      serviceId: parseInt(selectedServiceId),
      fromDate: selectedDate,
      toDate: selectedDate,
    },
    { enabled: !!selectedServiceId }
  );

  const createMutation = trpc.slots.create.useMutation({
    onSuccess: () => {
      toast.success("Slot created!");
      utils.slots.getForRange.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createBulkMutation = trpc.slots.createBulk.useMutation({
    onSuccess: (data) => {
      toast.success(`Created ${data.created} slots!`);
      utils.slots.getForRange.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const blockMutation = trpc.slots.setBlocked.useMutation({
    onSuccess: () => {
      utils.slots.getForRange.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreateSingle = () => {
    if (!selectedServiceId) return toast.error("Select a service first");
    createMutation.mutate({
      serviceId: parseInt(selectedServiceId),
      date: selectedDate,
      startTime,
      endTime,
      maxCapacity: parseInt(maxCapacity),
    });
  };

  const handleCreateBulk = () => {
    if (!selectedServiceId) return toast.error("Select a service first");
    const fromDate = selectedDate;
    const toDate = new Date(selectedDate + "T00:00:00");
    toDate.setDate(toDate.getDate() + bulkDays - 1);
    createBulkMutation.mutate({
      serviceId: parseInt(selectedServiceId),
      fromDate,
      toDate: toDate.toISOString().slice(0, 10),
      timeSlots: DEFAULT_TIME_SLOTS,
      maxCapacity: parseInt(maxCapacity),
    });
  };

  return (
    <AdminLayout title="Slots">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Manage Slots
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create time slots for players to book
        </p>
      </div>

      {/* Service + Date Selector */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Select Service & Date
          </p>
          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service..." />
              </SelectTrigger>
              <SelectContent>
                {services?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Single Slot */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Add Single Slot
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Max Capacity</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleCreateSingle}
            disabled={!selectedServiceId || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Slot
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Create */}
      <Card className="border border-border mb-6">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Bulk Create (Standard Schedule)
          </p>
          <p className="text-xs text-muted-foreground">
            Creates 10 standard time slots (6am–10am, 3pm–9pm) for the next N days
          </p>
          <div className="space-y-1.5">
            <Label>Number of Days</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={bulkDays}
              onChange={(e) => setBulkDays(parseInt(e.target.value))}
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreateBulk}
            disabled={!selectedServiceId || createBulkMutation.isPending}
          >
            {createBulkMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CalendarDays className="w-4 h-4 mr-2" />
            )}
            Create {bulkDays}-Day Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Existing Slots for Selected Date */}
      {selectedServiceId && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Slots on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {loadingSlots ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : slots && slots.length > 0 ? (
            <div className="space-y-2">
              {slots.map((slot) => (
                <Card
                  key={slot.id}
                  className={`border ${slot.availabilityStatus === "blocked" ? "border-red-200 bg-red-50/50" : "border-border"}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.bookedCount}/{slot.maxCapacity} booked
                          {slot.availabilityStatus === "blocked" && " · Blocked"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          blockMutation.mutate({ id: slot.id, blocked: slot.availabilityStatus !== "blocked" })
                        }
                        disabled={blockMutation.isPending}
                        className={slot.availabilityStatus === "blocked" ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"}
                      >
                        {slot.availabilityStatus === "blocked" ? (
                          <><Unlock className="w-3.5 h-3.5 mr-1" />Unblock</>
                        ) : (
                          <><Lock className="w-3.5 h-3.5 mr-1" />Block</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No slots for this date.</p>
              <p className="text-xs mt-1">Create slots above to get started.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
