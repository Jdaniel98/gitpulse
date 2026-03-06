"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DayCount } from "@/lib/types";

interface HeatmapProps {
  data: DayCount[];
}

function getIntensity(count: number, max: number): string {
  if (count === 0) return "bg-muted";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-emerald-900/40 dark:bg-emerald-400/20";
  if (ratio <= 0.5) return "bg-emerald-700/50 dark:bg-emerald-400/40";
  if (ratio <= 0.75) return "bg-emerald-600/70 dark:bg-emerald-400/60";
  return "bg-emerald-500 dark:bg-emerald-400/90";
}

export function ContributionHeatmap({ data }: HeatmapProps) {
  const { weeks, months, maxCount } = useMemo(() => {
    const countMap = new Map(data.map((d) => [d.date, d.count]));
    const today = new Date();
    const weeks: { date: Date; count: number }[][] = [];
    let maxCount = 0;

    // Go back 52 weeks from today
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Adjust to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: { date: Date; count: number }[] = [];
    const d = new Date(startDate);

    while (d <= today) {
      const dateStr = d.toISOString().split("T")[0];
      const count = countMap.get(dateStr) || 0;
      maxCount = Math.max(maxCount, count);
      currentWeek.push({ date: new Date(d), count });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Calculate month labels
    const months: { label: string; col: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      if (firstDay && firstDay.date.getMonth() !== lastMonth) {
        lastMonth = firstDay.date.getMonth();
        months.push({ label: monthNames[lastMonth], col: i });
      }
    });

    return { weeks, months, maxCount: maxCount || 1 };
  }, [data]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Contribution Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1">
            {/* Month labels */}
            <div className="ml-8 flex">
              {months.map((m, i) => (
                <span
                  key={i}
                  className="text-xs text-muted-foreground"
                  style={{
                    position: "relative",
                    left: `${m.col * 14}px`,
                    marginRight: i < months.length - 1 ? `${((months[i + 1]?.col || 0) - m.col) * 14 - 28}px` : 0,
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] pr-1">
                {dayLabels.map((label, i) => (
                  <span key={i} className="flex h-[11px] items-center text-[10px] text-muted-foreground">
                    {label}
                  </span>
                ))}
              </div>

              {/* Heatmap grid */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <Tooltip key={di}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-[11px] w-[11px] rounded-[2px] ${getIntensity(day.count, maxCount)} transition-colors hover:ring-1 hover:ring-foreground/20`}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <span className="font-medium">{day.count} contribution{day.count !== 1 ? "s" : ""}</span>
                        <span className="ml-1 text-muted-foreground">
                          {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-end gap-1">
              <span className="text-[10px] text-muted-foreground">Less</span>
              <div className="h-[11px] w-[11px] rounded-[2px] bg-muted" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-900/40 dark:bg-emerald-400/20" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-700/50 dark:bg-emerald-400/40" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-600/70 dark:bg-emerald-400/60" />
              <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-500 dark:bg-emerald-400/90" />
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
