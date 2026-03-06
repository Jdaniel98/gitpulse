import { NextRequest, NextResponse } from "next/server";
import { getGoals, upsertGoal, deleteGoal, getTodayCount, getWeekCount } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import type { GoalProgress } from "@/lib/types";

export async function GET() {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const goals = getGoals(userId);
  const todayCount = getTodayCount(userId);
  const weekCount = getWeekCount(userId);

  const progress: GoalProgress[] = goals.map((goal) => {
    const current = goal.period === "daily" ? todayCount : weekCount;
    return {
      ...goal,
      current,
      percentage: Math.min(100, Math.round((current / goal.target) * 100)),
    };
  });

  return NextResponse.json(progress);
}

export async function POST(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const body = await request.json();
  const goal = {
    id: body.id || `goal_${Date.now()}`,
    label: body.label,
    target: Number(body.target),
    period: body.period || "daily",
  };

  upsertGoal(goal, userId);
  return NextResponse.json(goal, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const { id } = await request.json();
  const deleted = deleteGoal(id, userId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
