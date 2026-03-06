"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Activity,
  PlusCircle,
  BarChart3,
  Settings,
  RefreshCw,
  Search,
  Keyboard,
  Sun,
  Moon,
  FileDown,
  Target,
} from "lucide-react";
import { useTheme } from "next-themes";
import { syncGitHub } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  section: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        description: "View streaks, heatmap, and stats",
        icon: LayoutDashboard,
        section: "Navigation",
        action: () => router.push("/"),
        keywords: ["home", "overview"],
      },
      {
        id: "nav-activity",
        label: "Go to Activity",
        description: "Browse all contributions",
        icon: Activity,
        section: "Navigation",
        action: () => router.push("/activity"),
        keywords: ["feed", "list", "contributions"],
      },
      {
        id: "nav-manual",
        label: "Log New Entry",
        description: "Add a manual contribution",
        icon: PlusCircle,
        section: "Navigation",
        action: () => router.push("/manual"),
        keywords: ["add", "create", "new", "entry"],
      },
      {
        id: "nav-analytics",
        label: "Go to Analytics",
        description: "Charts and insights",
        icon: BarChart3,
        section: "Navigation",
        action: () => router.push("/analytics"),
        keywords: ["charts", "stats", "graphs"],
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "Configure GitHub token and sync",
        icon: Settings,
        section: "Navigation",
        action: () => router.push("/settings"),
        keywords: ["config", "preferences", "token"],
      },
      // Actions
      {
        id: "action-sync",
        label: "Sync GitHub",
        description: "Fetch latest contributions from GitHub",
        icon: RefreshCw,
        section: "Actions",
        action: () => syncGitHub(),
        keywords: ["fetch", "refresh", "update", "pull"],
      },
      {
        id: "action-export-csv",
        label: "Export as CSV",
        description: "Download contributions as CSV",
        icon: FileDown,
        section: "Actions",
        action: () => window.open("/api/export?format=csv", "_blank"),
        keywords: ["download", "save"],
      },
      {
        id: "action-export-json",
        label: "Export as JSON",
        description: "Download contributions as JSON",
        icon: FileDown,
        section: "Actions",
        action: () => window.open("/api/export?format=json", "_blank"),
        keywords: ["download", "save"],
      },
      {
        id: "action-add-goal",
        label: "Add a Goal",
        description: "Set a new daily or weekly goal",
        icon: Target,
        section: "Actions",
        action: () => {
          router.push("/");
          setTimeout(() => window.dispatchEvent(new Event("open-add-goal")), 300);
        },
        keywords: ["target", "track"],
      },
      // Theme
      {
        id: "theme-light",
        label: "Switch to Light Mode",
        icon: Sun,
        section: "Theme",
        action: () => setTheme("light"),
        keywords: ["appearance", "bright"],
      },
      {
        id: "theme-dark",
        label: "Switch to Dark Mode",
        icon: Moon,
        section: "Theme",
        action: () => setTheme("dark"),
        keywords: ["appearance", "night"],
      },
      {
        id: "shortcuts-help",
        label: "Keyboard Shortcuts",
        description: "View all keyboard shortcuts",
        icon: Keyboard,
        section: "Help",
        action: () => window.dispatchEvent(new Event("toggle-shortcuts-help")),
        keywords: ["help", "keys", "hotkeys"],
      },
    ],
    [router, setTheme]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q))
    );
  }, [commands, query]);

  // Filter out the current theme option
  const displayItems = useMemo(() => {
    return filtered.filter((cmd) => {
      if (cmd.id === "theme-light" && resolvedTheme === "light") return false;
      if (cmd.id === "theme-dark" && resolvedTheme === "dark") return false;
      return true;
    });
  }, [filtered, resolvedTheme]);

  // Group by section
  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of displayItems) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    }
    return map;
  }, [displayItems]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Open/close with Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for external open events
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-command-palette", handler);
    return () => window.removeEventListener("open-command-palette", handler);
  }, []);

  const runCommand = useCallback(
    (cmd: CommandItem) => {
      setOpen(false);
      setQuery("");
      cmd.action();
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % displayItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + displayItems.length) % displayItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (displayItems[selectedIndex]) {
          runCommand(displayItems[selectedIndex]);
        }
      }
    },
    [displayItems, selectedIndex, runCommand]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent px-3 py-3 text-sm shadow-none focus-visible:ring-0"
            autoFocus
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {displayItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          ) : (
            [...sections.entries()].map(([section, items]) => {
              // Calculate flat index offset for this section
              let flatOffset = 0;
              for (const [s, sItems] of sections.entries()) {
                if (s === section) break;
                flatOffset += sItems.length;
              }

              return (
                <div key={section}>
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {section}
                  </p>
                  {items.map((item, i) => {
                    const flatIndex = flatOffset + i;
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => runCommand(item)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.label}</p>
                          {item.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
