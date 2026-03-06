"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  MessageSquare,
  Star,
  GitFork,
  PenLine,
  ExternalLink,
  Calendar,
  GitBranch,
  Clock,
} from "lucide-react";
import type { Contribution, ContributionType } from "@/lib/types";
import { typeConfig } from "@/lib/contribution-utils";
import { format, formatDistanceToNow } from "date-fns";

const typeIcons: Record<ContributionType, React.ElementType> = {
  commit: GitCommitHorizontal,
  pr: GitPullRequest,
  issue: CircleDot,
  review: MessageSquare,
  star: Star,
  fork: GitFork,
  manual: PenLine,
};

interface ContributionDetailProps {
  contribution: Contribution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContributionDetail({ contribution, open, onOpenChange }: ContributionDetailProps) {
  if (!contribution) return null;

  const config = typeConfig[contribution.type];
  const Icon = typeIcons[contribution.type] || PenLine;
  const createdAt = new Date(contribution.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base leading-snug">{contribution.title}</DialogTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                  {config.label}
                </Badge>
                {contribution.source === "manual" && (
                  <Badge variant="secondary" className="text-[10px]">manual</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {contribution.description && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Description</p>
              <p className="text-sm leading-relaxed">{contribution.description}</p>
            </div>
          )}

          <div className="grid gap-3 rounded-lg border border-border p-3">
            {contribution.repo && (
              <div className="flex items-center gap-2.5">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Repository</p>
                  <p className="text-sm font-medium">{contribution.repo}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">
                  {format(createdAt, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">
                  {format(createdAt, "h:mm a")} ({formatDistanceToNow(createdAt, { addSuffix: true })})
                </p>
              </div>
            </div>
          </div>

          {contribution.url && (
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={contribution.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
