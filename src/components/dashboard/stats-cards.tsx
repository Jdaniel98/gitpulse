"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  MessageSquare,
  Star,
  GitFork,
  PenLine,
} from "lucide-react";
import type { TypeCount } from "@/lib/types";
import { typeConfig } from "@/lib/contribution-utils";
import type { ContributionType } from "@/lib/types";

const typeIcons: Record<ContributionType, React.ElementType> = {
  commit: GitCommitHorizontal,
  pr: GitPullRequest,
  issue: CircleDot,
  review: MessageSquare,
  star: Star,
  fork: GitFork,
  manual: PenLine,
};

interface StatsCardsProps {
  data: TypeCount[];
  total: number;
}

export function StatsCards({ data, total }: StatsCardsProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Total Contributions</h3>
          <span className="text-3xl font-bold">{total}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((item) => {
            const config = typeConfig[item.type as ContributionType];
            const Icon = typeIcons[item.type as ContributionType] || PenLine;
            return (
              <div
                key={item.type}
                className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2"
              >
                <Icon className={`h-3.5 w-3.5 ${config?.color || "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{config?.label || item.type}</p>
                  <p className="text-sm font-semibold">{item.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
