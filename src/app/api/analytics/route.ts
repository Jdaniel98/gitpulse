import { NextResponse } from "next/server";
import {
  getDailyCounts,
  getTypeCounts,
  getRepoCounts,
  getDayOfWeekCounts,
  getTotalCount,
  getWeekCount,
  getLastWeekCount,
  getMonthlyCounts,
  getHourOfDayCounts,
  getDailyCountsByType,
  getPunchCardData,
} from "@/lib/db";
import type { AnalyticsData, StreakInfo, Insight } from "@/lib/types";

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

function generateInsights(
  daily: { date: string; count: number }[],
  byType: { type: string; count: number }[],
  byRepo: { repo: string; count: number }[],
  byDayOfWeek: { day: string; count: number }[],
  total: number,
  streak: StreakInfo
): Insight[] {
  const insights: Insight[] = [];

  // Most productive day of week
  const bestDay = byDayOfWeek.reduce((a, b) => (b.count > a.count ? b : a), byDayOfWeek[0]);
  if (bestDay && bestDay.count > 0) {
    insights.push({
      label: "Most Productive Day",
      value: bestDay.day,
      detail: `${bestDay.count} contributions on ${bestDay.day}s`,
    });
  }

  // Weekly comparison
  const thisWeek = getWeekCount();
  const lastWeek = getLastWeekCount();
  if (lastWeek > 0) {
    const change = thisWeek - lastWeek;
    const pct = Math.round((Math.abs(change) / lastWeek) * 100);
    insights.push({
      label: "vs Last Week",
      value: `${change >= 0 ? "+" : ""}${change}`,
      detail: `${pct}% ${change >= 0 ? "increase" : "decrease"} from last week`,
      trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    });
  } else if (thisWeek > 0) {
    insights.push({
      label: "This Week",
      value: String(thisWeek),
      detail: "contributions so far this week",
      trend: "up",
    });
  }

  // Top contribution type
  if (byType.length > 0) {
    const topType = byType[0];
    const pct = Math.round((topType.count / total) * 100);
    insights.push({
      label: "Top Activity",
      value: topType.type.charAt(0).toUpperCase() + topType.type.slice(1) + "s",
      detail: `${pct}% of all contributions (${topType.count})`,
    });
  }

  // Daily average (last 30 days)
  const last30 = daily.slice(-30);
  if (last30.length > 0) {
    const totalLast30 = last30.reduce((sum, d) => sum + d.count, 0);
    const avg = (totalLast30 / 30).toFixed(1);
    insights.push({
      label: "Daily Average",
      value: avg,
      detail: "contributions per day (last 30 days)",
    });
  }

  // Most active repo this week
  if (byRepo.length > 0) {
    insights.push({
      label: "Top Repository",
      value: byRepo[0].repo,
      detail: `${byRepo[0].count} contributions`,
    });
  }

  // Streak insight
  if (streak.current >= 3) {
    insights.push({
      label: "Streak Status",
      value: `${streak.current} days`,
      detail: streak.current >= streak.longest ? "New personal best!" : `${streak.longest - streak.current} days to beat your record`,
      trend: "up",
    });
  }

  return insights;
}

export async function GET() {
  const daily = getDailyCounts(365);
  const byType = getTypeCounts();
  const byRepo = getRepoCounts(10);
  const byDayOfWeek = getDayOfWeekCounts();
  const byHourOfDay = getHourOfDayCounts();
  const monthly = getMonthlyCounts(12);
  const total = getTotalCount();
  const streak = calculateStreak(daily);
  const insights = generateInsights(daily, byType, byRepo, byDayOfWeek, total, streak);

  // Build daily-by-type data for stacked area chart
  const rawByType = getDailyCountsByType(365);
  const typeSet = new Set(rawByType.map((r) => r.type));
  const dateMap = new Map<string, Record<string, number>>();
  for (const row of rawByType) {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, { date: 0 } as unknown as Record<string, number>);
    }
    dateMap.get(row.date)![row.type] = row.count;
  }
  const dailyByType = [...dateMap.entries()].map(([date, types]) => ({
    date,
    ...Object.fromEntries([...typeSet].map((t) => [t, types[t] || 0])),
  }));

  const punchCard = getPunchCardData();

  const data: AnalyticsData = {
    daily,
    byType,
    byRepo,
    byDayOfWeek,
    byHourOfDay,
    monthly,
    dailyByType,
    punchCard,
    total,
    streak,
    insights,
  };

  return NextResponse.json(data);
}
