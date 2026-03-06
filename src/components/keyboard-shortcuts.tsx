"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncGitHub } from "@/components/layout/sidebar";

const shortcuts = [
  { keys: ["G", "D"], label: "Go to Dashboard" },
  { keys: ["G", "A"], label: "Go to Activity" },
  { keys: ["G", "S"], label: "Go to Settings" },
  { keys: ["N"], label: "New contribution" },
  { keys: ["S"], label: "Sync GitHub" },
  { keys: ["?"], label: "Show shortcuts" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingG, setPendingG] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();

      if (key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      if (pendingG) {
        setPendingG(false);
        if (key === "d") { router.push("/"); return; }
        if (key === "a") { router.push("/activity"); return; }
        if (key === "s") { router.push("/settings"); return; }
        return;
      }

      if (key === "g") {
        setPendingG(true);
        setTimeout(() => setPendingG(false), 1000);
        return;
      }

      if (key === "n") {
        e.preventDefault();
        router.push("/manual");
        return;
      }

      if (key === "s") {
        e.preventDefault();
        syncGitHub();
        return;
      }
    },
    [router, pendingG]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handler = () => setOpen((o) => !o);
    window.addEventListener("toggle-shortcuts-help", handler);
    return () => window.removeEventListener("toggle-shortcuts-help", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-0.5 text-xs text-muted-foreground">then</span>}
                    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs">
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
