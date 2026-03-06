import { NextRequest, NextResponse } from "next/server";
import { getGoals, upsertGoal, deleteGoal, getTodayCount, getWeekCount } from "@/lib/db";
import type { GoalProgress } from "@/lib/types";

export async function GET() {
  const goals = getGoals();
  const todayCount = getTodayCount();
  const weekCount = getWeekCount();

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
  const body = await request.json();
  const goal = {
    id: body.id || `goal_${Date.now()}`,
    label: body.label,
    target: Number(body.target),
    period: body.period || "daily",
  };

  upsertGoal(goal);
  return NextResponse.json(goal, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const deleted = deleteGoal(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
