"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Github, Key, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoadingSettings(false);
      });
  }, []);

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save token");
      } else {
        toast.success(`Connected as ${data.username}`);
        setToken("");
        setSettings((prev) => ({
          ...prev,
          github_token: "••••••••" + token.slice(-4),
          github_username: data.username || prev.github_username,
          github_avatar: data.avatar || prev.github_avatar,
        }));
      }
    } catch {
      toast.error("Failed to save token");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="Settings" />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="h-4 w-4" />
              GitHub Connection
            </CardTitle>
            <CardDescription>
              Connect your GitHub account to automatically sync contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSettings ? (
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
            ) : settings.github_username ? (
              <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                {settings.github_avatar && (
                  <img
                    src={settings.github_avatar}
                    alt="Avatar"
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{settings.github_username}</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Token: {settings.github_token}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">No GitHub account connected</p>
              </div>
            )}

            <Separator />

            <form onSubmit={handleSaveToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Personal Access Token
                </Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Create a token with <code className="rounded bg-muted px-1 py-0.5">read:user</code> and{" "}
                  <code className="rounded bg-muted px-1 py-0.5">repo</code> scopes.{" "}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=read:user,repo&description=GitPulse%20Tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-emerald-500 hover:underline"
                  >
                    Create one
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <Button type="submit" disabled={saving || !token.trim()}>
                {saving ? "Validating..." : settings.github_username ? "Update Token" : "Connect"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About GitPulse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              GitPulse tracks your daily GitHub contributions across open source projects,
              personal repositories, and manual entries. All data is stored locally on your machine.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="text-sm font-medium">1.0.0</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="text-sm font-medium">Local SQLite</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
