"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";
import { Github } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white animate-pulse">
          <Github className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoginPage = pathname === "/login";

  // Show loading screen while session is being resolved
  if (status === "loading" && !isLoginPage) {
    return <LoadingScreen />;
  }

  // Login page or unauthenticated: no sidebar/shell
  if (isLoginPage || status !== "authenticated") {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  // Authenticated: full app with sidebar
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <KeyboardShortcuts />
      <CommandPalette />
    </div>
  );
}
