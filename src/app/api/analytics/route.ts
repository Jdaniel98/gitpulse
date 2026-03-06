import { NextResponse } from "next/server";
import {
  getDailyCounts,
  getTypeCounts,
  getRepoCounts,
  getDayOfWeekCounts,
  getTotalCount,
} from "@/lib/db";
import type { AnalyticsData, StreakInfo } from "@/lib/types";

function calculateStreak(dailyCounts: { date: string; count: number }[]): StreakInfo {
  const today = new Date().toISOString().split("T")[0];
  const countMap = new Map(dailyCounts.map((d) => [d.date, d.count]));

  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  const todayCount = countMap.get(today) || 0;

  // Calculate current streak (going backwards from today)
  const date = new Date();
  // If no contributions today, start from yesterday
  if (!countMap.has(today)) {
    date.setDate(date.getDate() - 1);
  }
  while (true) {
    const dateStr = date.toISOString().split("T")[0];
    if (countMap.has(dateStr)) {
      current++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  const sortedDates = [...countMap.keys()].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
    }
    longest = Math.max(longest, tempStreak);
  }

  return { current, longest, todayCount };
}

export async function GET() {
  const daily = getDailyCounts(365);
  const byType = getTypeCounts();
  const byRepo = getRepoCounts(10);
  const byDayOfWeek = getDayOfWeekCounts();
  const total = getTotalCount();
  const streak = calculateStreak(daily);

  const data: AnalyticsData = {
    daily,
    byType,
    byRepo,
    byDayOfWeek,
    total,
    streak,
  };

  return NextResponse.json(data);
}
