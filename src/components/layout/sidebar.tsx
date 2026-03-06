"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Activity,
  PlusCircle,
  BarChart3,
  Settings,
  Github,
  RefreshCw,
  Clock,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/manual", label: "Log Entry", icon: PlusCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export async function syncGitHub() {
  const toastId = toast.loading("Syncing with GitHub...");
  try {
    const res = await fetch("/api/github/sync", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Synced ${data.new} new contribution${data.new !== 1 ? "s" : ""} from GitHub`, { id: toastId });
      window.dispatchEvent(new Event("contributions-updated"));
      return true;
    } else {
      toast.error(data.error || "Sync failed", { id: toastId });
      return false;
    }
  } catch {
    toast.error("Failed to connect to GitHub", { id: toastId });
    return false;
  }
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadLastSynced = useCallback(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setLastSynced(data.last_synced || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadLastSynced();
  }, [loadLastSynced]);

  // Refresh "X minutes ago" display every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Auto-sync setup
  useEffect(() => {
    const setupAutoSync = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        const intervalMinutes = parseInt(data.sync_interval || "0", 10);

        if (intervalRef.current) clearInterval(intervalRef.current);

        if (intervalMinutes > 0) {
          intervalRef.current = setInterval(() => {
            syncGitHub().then(() => {
              setLastSynced(new Date().toISOString());
            });
          }, intervalMinutes * 60 * 1000);
        }
      } catch {}
    };
    setupAutoSync();

    const handler = () => setupAutoSync();
    window.addEventListener("settings-updated", handler);
    return () => {
      window.removeEventListener("settings-updated", handler);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const success = await syncGitHub();
    if (success) {
      const now = new Date().toISOString();
      setLastSynced(now);
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last_synced: now }),
      });
    }
    setSyncing(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Github className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">GitPulse</h1>
          <p className="text-xs text-muted-foreground">Contribution Tracker</p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 px-3 pb-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Sync GitHub"}
        </Button>
        {lastSynced && (
          <div className="flex items-center gap-1.5 px-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Last synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* User profile */}
      {session?.user && (
        <>
          <Separator />
          <div className="flex items-center gap-3 px-4 py-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {session.user.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{session.user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{session.user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card md:flex">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
