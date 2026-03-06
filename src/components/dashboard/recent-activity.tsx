"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  MessageSquare,
  Star,
  GitFork,
  PenLine,
  ExternalLink,
  Activity,
} from "lucide-react";
import type { Contribution, ContributionType } from "@/lib/types";
import { typeConfig } from "@/lib/contribution-utils";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<ContributionType, React.ElementType> = {
  commit: GitCommitHorizontal,
  pr: GitPullRequest,
  issue: CircleDot,
  review: MessageSquare,
  star: Star,
  fork: GitFork,
  manual: PenLine,
};

interface RecentActivityProps {
  contributions: Contribution[];
}

export function RecentActivity({ contributions }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {contributions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium">No contributions yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Sync from GitHub or add one manually to get started
            </p>
            <div className="flex gap-2">
              <a href="/settings" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Connect GitHub
              </a>
              <a href="/manual" className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent">
                Log Entry
              </a>
            </div>
          </div>
        ) : (
          contributions.map((c) => {
            const config = typeConfig[c.type];
            const Icon = typeIcons[c.type] || PenLine;
            return (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${config.bgColor}`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {c.repo && (
                      <span className="truncate text-xs text-muted-foreground">{c.repo}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${config.color}`}>
                  {config.label}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
