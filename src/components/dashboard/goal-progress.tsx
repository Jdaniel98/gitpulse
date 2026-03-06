"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Target, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { GoalProgress as GoalProgressType } from "@/lib/types";

export function GoalProgress() {
  const [goals, setGoals] = useState<GoalProgressType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: "", target: "5", period: "daily" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const fetchGoals = async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
    const handler = () => fetchGoals();
    window.addEventListener("contributions-updated", handler);
    return () => window.removeEventListener("contributions-updated", handler);
  }, []);

  const handleAdd = async () => {
    if (!newGoal.label.trim() || !newGoal.target) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGoal),
    });
    toast.success(`Goal "${newGoal.label}" added`);
    setNewGoal({ label: "", target: "5", period: "daily" });
    setDialogOpen(false);
    fetchGoals();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch("/api/goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    toast.success(`Goal "${deleteTarget.label}" removed`);
    setDeleteTarget(null);
    fetchGoals();
  };

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-card" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-emerald-500" />
            Goals
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="goal-label">Goal Name</Label>
                  <Input
                    id="goal-label"
                    placeholder="e.g., Daily commits"
                    value={newGoal.label}
                    onChange={(e) => setNewGoal((g) => ({ ...g, label: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-target">Target</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      min="1"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal((g) => ({ ...g, target: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select
                      value={newGoal.period}
                      onValueChange={(v) => setNewGoal((g) => ({ ...g, period: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!newGoal.label.trim()}>
                  Add Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No goals set. Add one to track your progress!
          </p>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="group space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {goal.percentage >= 100 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : null}
                  <span className="text-sm font-medium">{goal.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({goal.period})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums">
                    <span className={goal.percentage >= 100 ? "text-emerald-500 font-semibold" : ""}>
                      {goal.current}
                    </span>
                    <span className="text-muted-foreground">/{goal.target}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget({ id: goal.id, label: goal.label })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    goal.percentage >= 100 ? "bg-emerald-500" : "bg-emerald-500/60"
                  }`}
                  style={{ width: `${goal.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the goal &ldquo;{deleteTarget?.label}&rdquo;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
