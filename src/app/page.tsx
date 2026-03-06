"use client";

import { Header } from "@/components/layout/header";
import { ContributionHeatmap } from "@/components/dashboard/heatmap";
import { StreakCards } from "@/components/dashboard/streak-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { useContributions, useAnalytics } from "@/hooks/use-contributions";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Streak cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg skeleton-shimmer" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 rounded skeleton-shimmer" />
                <div className="h-6 w-12 rounded skeleton-shimmer" />
                <div className="h-2.5 w-20 rounded skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Goals skeleton */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-16 rounded skeleton-shimmer" />
          <div className="h-6 w-20 rounded skeleton-shimmer" />
        </div>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-28 rounded skeleton-shimmer" />
                <div className="h-3 w-10 rounded skeleton-shimmer" />
              </div>
              <div className="h-2 w-full rounded-full skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap skeleton */}
      <div className="rounded-xl border bg-card p-5">
        <div className="h-4 w-36 rounded skeleton-shimmer mb-4" />
        <div className="h-[140px] rounded skeleton-shimmer" />
      </div>

      {/* Stats skeleton */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex justify-between mb-4">
          <div className="h-4 w-32 rounded skeleton-shimmer" />
          <div className="h-7 w-14 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
              <div className="h-3.5 w-3.5 rounded skeleton-shimmer" />
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 w-14 rounded skeleton-shimmer" />
                <div className="h-3.5 w-8 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div className="rounded-xl border bg-card p-5">
        <div className="h-4 w-28 rounded skeleton-shimmer mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
              <div className="h-7 w-7 rounded-md skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
                <div className="h-2.5 w-1/2 rounded skeleton-shimmer" />
              </div>
              <div className="h-5 w-14 rounded skeleton-shimmer shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: contributions, loading: contribLoading } = useContributions({ limit: 10 });
  const { data: analytics, loading: analyticsLoading } = useAnalytics();

  const loading = contribLoading || analyticsLoading;

  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-6 p-6">
        {loading ? (
          <DashboardSkeleton />
        ) : analytics ? (
          <>
            <StreakCards streak={analytics.streak} />
            <GoalProgress />
            <ContributionHeatmap data={analytics.daily} />
            <StatsCards data={analytics.byType} total={analytics.total} />
            <RecentActivity contributions={contributions} />
          </>
        ) : null}
      </div>
    </>
  );
}
