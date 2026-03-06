"use client";

import { Header } from "@/components/layout/header";
import { ContributionHeatmap } from "@/components/dashboard/heatmap";
import { StreakCards } from "@/components/dashboard/streak-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useContributions, useAnalytics } from "@/hooks/use-contributions";

export default function DashboardPage() {
  const { data: contributions, loading: contribLoading } = useContributions({ limit: 10 });
  const { data: analytics, loading: analyticsLoading } = useAnalytics();

  const loading = contribLoading || analyticsLoading;

  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-6 p-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-card" />
            <div className="h-32 animate-pulse rounded-xl bg-card" />
            <div className="h-64 animate-pulse rounded-xl bg-card" />
          </div>
        ) : analytics ? (
          <>
            <StreakCards streak={analytics.streak} />
            <ContributionHeatmap data={analytics.daily} />
            <StatsCards data={analytics.byType} total={analytics.total} />
            <RecentActivity contributions={contributions} />
          </>
        ) : null}
      </div>
    </>
  );
}
