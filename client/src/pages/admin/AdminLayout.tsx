import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/slots", label: "Slots", icon: Clock },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 bg-background">
        <span className="text-4xl">🏏</span>
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
          Admin Login Required
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to access the BestCricketAcademy admin panel.
        </p>
        <a href={getLoginUrl()}>
          <Button size="lg" className="w-full max-w-xs">Sign In</Button>
        </a>
        <Link href="/">
          <Button variant="ghost" size="sm">← Back to Home</Button>
        </Link>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 bg-background">
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground text-center">
          Your account does not have admin privileges.
        </p>
              <Button variant="outline" onClick={logout}>Sign Out</Button>
        <Link href="/"><Button variant="ghost" size="sm">← Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
                BCA Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sidebar-foreground/70 hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors sm:hidden"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {menuOpen && (
          <div className="sm:hidden bg-sidebar border-t border-sidebar-border">
            <nav className="container py-2 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      location === href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                </Link>
              ))}
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden sm:flex flex-col w-56 min-h-[calc(100vh-56px)] bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-14 shrink-0">
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    location === href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors mt-1">
                ← View Site
              </button>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container py-6 max-w-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
