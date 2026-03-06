"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoginPage = pathname === "/login";
  const isAuthenticated = status === "authenticated";

  if (isLoginPage || !isAuthenticated) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <KeyboardShortcuts />
      <CommandPalette />
    </>
  );
}
