import type { ContributionType } from "./types";

export const typeConfig: Record<
  ContributionType,
  { label: string; color: string; bgColor: string }
> = {
  commit: { label: "Commit", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  pr: { label: "Pull Request", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  issue: { label: "Issue", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  review: { label: "Review", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  star: { label: "Star", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  fork: { label: "Fork", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  manual: { label: "Manual", color: "text-pink-500", bgColor: "bg-pink-500/10" },
};

export const typeColors: Record<ContributionType, string> = {
  commit: "#10b981",
  pr: "#3b82f6",
  issue: "#f97316",
  review: "#a855f7",
  star: "#eab308",
  fork: "#06b6d4",
  manual: "#ec4899",
};
