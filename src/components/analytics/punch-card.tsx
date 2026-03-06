"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Grid3X3 } from "lucide-react";
import type { PunchCardCell } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensityClass(ratio: number): string {
  if (ratio === 0) return "bg-muted";
  if (ratio <= 0.25) return "bg-emerald-900/40 dark:bg-emerald-400/20";
  if (ratio <= 0.5) return "bg-emerald-700/50 dark:bg-emerald-400/40";
  if (ratio <= 0.75) return "bg-emerald-600/70 dark:bg-emerald-400/60";
  return "bg-emerald-500 dark:bg-emerald-400/90";
}

interface PunchCardProps {
  data: PunchCardCell[];
}

export function PunchCard({ data }: PunchCardProps) {
  const { grid, maxCount } = useMemo(() => {
    // Build 7x24 grid
    const grid: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );
    let maxCount = 0;

    for (const cell of data) {
      grid[cell.dayOfWeek][cell.hour] = cell.count;
      maxCount = Math.max(maxCount, cell.count);
    }

    return { grid, maxCount: maxCount || 1 };
  }, [data]);

  const isEmpty = data.length === 0 || data.every((d) => d.count === 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          Punch Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Hour labels */}
              <div className="ml-10 flex">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="flex items-center justify-center text-[10px] text-muted-foreground"
                    style={{ width: 24, minWidth: 24 }}
                  >
                    {h % 3 === 0 ? `${h.toString().padStart(2, "0")}` : ""}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {DAY_LABELS.map((day, dayIdx) => (
                <div key={day} className="flex items-center">
                  <span className="w-10 shrink-0 text-right pr-2 text-[11px] text-muted-foreground">
                    {day}
                  </span>
                  <div className="flex gap-[2px]">
                    {HOURS.map((hour) => {
                      const count = grid[dayIdx][hour];
                      const ratio = count / maxCount;
                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[20px] w-[20px] rounded-[3px] transition-colors hover:ring-1 hover:ring-foreground/20 ${getIntensityClass(ratio)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <span className="font-medium">{count} contribution{count !== 1 ? "s" : ""}</span>
                            <span className="ml-1 text-muted-foreground">
                              {day} at {hour.toString().padStart(2, "0")}:00
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="mt-3 flex items-center justify-end gap-1">
                <span className="text-[10px] text-muted-foreground">Less</span>
                <div className="h-[14px] w-[14px] rounded-[2px] bg-muted" />
                <div className="h-[14px] w-[14px] rounded-[2px] bg-emerald-900/40 dark:bg-emerald-400/20" />
                <div className="h-[14px] w-[14px] rounded-[2px] bg-emerald-700/50 dark:bg-emerald-400/40" />
                <div className="h-[14px] w-[14px] rounded-[2px] bg-emerald-600/70 dark:bg-emerald-400/60" />
                <div className="h-[14px] w-[14px] rounded-[2px] bg-emerald-500 dark:bg-emerald-400/90" />
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
