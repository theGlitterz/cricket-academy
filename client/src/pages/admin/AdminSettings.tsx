import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Save, Upload, Loader2, CheckCircle2 } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function AdminSettings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    facilityName: "",
    address: "",
    contactWhatsApp: "",
    upiId: "",
    paymentInstructions: "",
    workingHours: "",
    googleMapsUrl: "",
  });

  const [qrUploading, setQrUploading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        facilityName: settings.facilityName ?? "",
        address: settings.address ?? "",
        contactWhatsApp: settings.contactWhatsApp ?? "",
        upiId: settings.upiId ?? "",
        paymentInstructions: settings.paymentInstructions ?? "",
        workingHours: settings.workingHours ?? "",
        googleMapsUrl: settings.googleMapsUrl ?? "",
      });
      setQrUrl(settings.upiQrCodeUrl ?? null);
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved!");
      utils.settings.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadQrMutation = trpc.settings.uploadQrCode.useMutation({
    onSuccess: (data) => {
      setQrUrl(data.url);
      setQrUploading(false);
      toast.success("QR code uploaded!");
      utils.settings.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setQrUploading(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      facilityName: form.facilityName || undefined,
      address: form.address || undefined,
      contactWhatsApp: form.contactWhatsApp || undefined,
      upiId: form.upiId || undefined,
      paymentInstructions: form.paymentInstructions || undefined,
      workingHours: form.workingHours || undefined,
      googleMapsUrl: form.googleMapsUrl || undefined,
    });
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("QR image too large. Max 2MB.");
      return;
    }
    setQrUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadQrMutation.mutate({ imageBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (isLoading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Facility Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your facility details and payment info
        </p>
      </div>

      {/* Facility Info */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Facility Information
          </p>
          <div className="space-y-1.5">
            <Label>Facility Name</Label>
            <Input value={form.facilityName} onChange={set("facilityName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea
              value={form.address}
              onChange={set("address")}
              rows={2}
              placeholder="Full address shown on booking page"
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Contact</Label>
            <Input
              type="tel"
              value={form.contactWhatsApp}
              onChange={set("contactWhatsApp")}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Working Hours</Label>
            <Input
              value={form.workingHours}
              onChange={set("workingHours")}
              placeholder="e.g. 6:00 AM – 9:00 PM"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps URL</Label>
            <Input
              value={form.googleMapsUrl}
              onChange={set("googleMapsUrl")}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Payment Settings
          </p>
          <div className="space-y-1.5">
            <Label>UPI ID</Label>
            <Input
              value={form.upiId}
              onChange={set("upiId")}
              placeholder="e.g. coach@upi or 9876543210@paytm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Instructions</Label>
            <Textarea
              value={form.paymentInstructions}
              onChange={set("paymentInstructions")}
              rows={2}
              placeholder="e.g. Pay and upload screenshot to confirm your booking"
            />
          </div>

          {/* UPI QR Code */}
          <div className="space-y-2">
            <Label>UPI QR Code</Label>
            {qrUrl ? (
              <div className="space-y-2">
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  className="w-32 h-32 object-contain rounded-lg border border-border bg-muted"
                />
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  QR code uploaded
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No QR code uploaded yet.</p>
            )}
            <input
              ref={qrRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => qrRef.current?.click()}
              disabled={qrUploading}
            >
              {qrUploading ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="w-3.5 h-3.5 mr-1.5" />{qrUrl ? "Replace QR Code" : "Upload QR Code"}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" />Save Settings</>
        )}
      </Button>
    </AdminLayout>
  );
}
