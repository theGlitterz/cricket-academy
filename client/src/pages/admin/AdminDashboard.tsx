import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  Users,
} from "lucide-react";
import AdminLayout from "./AdminLayout";

function StatCard({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <span className="text-4xl">🏏</span>
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Admin Login Required
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to access the BestCricketAcademy admin panel.
        </p>
        <a href={getLoginUrl()}>
          <Button size="lg" className="w-full max-w-xs">
            Sign In
          </Button>
        </a>
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <XCircle className="w-12 h-12 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground text-center">
          Your account does not have admin privileges.
        </p>
        <Button variant="outline" onClick={logout}>
          Sign Out
        </Button>
        <Link href="/">
          <Button variant="ghost" size="sm">← Back to Home</Button>
        </Link>
      </div>
    );
  }

  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const { data: stats, isLoading } = trpc.bookings.stats.useQuery();
  const { data: recentBookings } = trpc.bookings.adminList.useQuery({
    status: "pending",
  });

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Welcome back, {user?.name?.split(" ")[0] ?? "Coach"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening at BestCricketAcademy
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            label="Pending"
            value={stats?.pending ?? 0}
            icon={<Clock className="w-5 h-5 text-yellow-600" />}
            colorClass="bg-yellow-100"
          />
          <StatCard
            label="Confirmed"
            value={stats?.confirmed ?? 0}
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
            colorClass="bg-green-100"
          />
          <StatCard
            label="Rejected"
            value={stats?.rejected ?? 0}
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            colorClass="bg-red-100"
          />
          <StatCard
            label="Total"
            value={stats?.total ?? 0}
            icon={<BarChart3 className="w-5 h-5 text-primary" />}
            colorClass="bg-primary/10"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </p>
        {[
          {
            href: "/admin/bookings",
            icon: <CalendarDays className="w-5 h-5 text-primary" />,
            label: "Manage Bookings",
            desc: `${stats?.pending ?? 0} pending review`,
          },
          {
            href: "/admin/slots",
            icon: <Clock className="w-5 h-5 text-primary" />,
            label: "Manage Slots",
            desc: "Create or block time slots",
          },
          {
            href: "/admin/settings",
            icon: <Settings className="w-5 h-5 text-primary" />,
            label: "Facility Settings",
            desc: "UPI, contact, working hours",
          },
        ].map(({ href, icon, label, desc }) => (
          <Link key={href} href={href}>
            <Card className="border border-border hover:border-primary/40 transition-colors cursor-pointer active:scale-[0.98]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Bookings Preview */}
      {recentBookings && recentBookings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pending Bookings
            </p>
            <Link href="/admin/bookings">
              <span className="text-xs text-primary">View all →</span>
            </Link>
          </div>
          {recentBookings.slice(0, 3).map((booking) => (
            <Link key={booking.id} href={`/admin/bookings/${booking.id}`}>
              <Card className="border border-border hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{booking.playerName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{booking.referenceId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        ₹{parseFloat(booking.amountPaid).toLocaleString("en-IN")}
                      </p>
                      <span className="text-xs status-pending px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
