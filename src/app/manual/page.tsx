"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { typeConfig } from "@/lib/contribution-utils";
import type { ContributionType } from "@/lib/types";
import { toast } from "sonner";

const presets = [
  { type: "review" as const, title: "Code Review", description: "Reviewed pull request" },
  { type: "manual" as const, title: "Pair Programming", description: "Pair programming session" },
  { type: "manual" as const, title: "Mentoring", description: "Mentored a team member" },
  { type: "manual" as const, title: "Documentation", description: "Wrote documentation" },
  { type: "manual" as const, title: "Bug Investigation", description: "Investigated and triaged a bug" },
  { type: "issue" as const, title: "Bug Report", description: "Filed a bug report" },
];

export default function ManualEntryPage() {
  const [type, setType] = useState<ContributionType>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repo, setRepo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          repo: repo.trim() || undefined,
          source: "manual",
          created_at: new Date(date + "T12:00:00").toISOString(),
        }),
      });
      toast.success(`"${title.trim()}" added successfully`);
      setTitle("");
      setDescription("");
      setRepo("");
      window.dispatchEvent(new Event("contributions-updated"));
    } catch {
      toast.error("Failed to save contribution");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreset = (preset: typeof presets[number]) => {
    setType(preset.type);
    setTitle(preset.title);
    setDescription(preset.description);
  };

  return (
    <>
      <Header title="Log Contribution" />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {/* Quick presets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Add</CardTitle>
            <CardDescription>Click a preset to pre-fill the form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, i) => {
                const config = typeConfig[preset.type];
                return (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handlePreset(preset)}
                  >
                    <div className={`h-2 w-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
                    {preset.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Entry form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Entry</CardTitle>
            <CardDescription>Record a contribution that isn't captured by GitHub</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ContributionType)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="What did you do?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add more details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo">Repository (optional)</Label>
                <Input
                  id="repo"
                  placeholder="owner/repo"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={submitting || !title.trim()} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                {submitting ? "Saving..." : "Add Contribution"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
