"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/use-contributions";
import { typeColors } from "@/lib/contribution-utils";
import { typeConfig } from "@/lib/contribution-utils";
import type { ContributionType } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Lightbulb, Clock } from "lucide-react";
import { PunchCard } from "@/components/analytics/punch-card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 0 },
] as const;

export default function AnalyticsPage() {
  const { data: analytics, loading } = useAnalytics();
  const [rangeDays, setRangeDays] = useState(30);

  // Filter daily data by selected range
  const filteredDaily = useMemo(() => {
    if (!analytics) return [];
    const data = rangeDays === 0 ? analytics.daily : analytics.daily.slice(-rangeDays);
    return data.map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [analytics, rangeDays]);

  // Filter daily-by-type data by range
  const filteredDailyByType = useMemo(() => {
    if (!analytics) return [];
    const data = rangeDays === 0 ? analytics.dailyByType : analytics.dailyByType.slice(-rangeDays);
    return data.map((d) => ({
      ...d,
      date: new Date(d.date as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [analytics, rangeDays]);

  // Get unique types from daily-by-type data
  const contributionTypes = useMemo(() => {
    if (!analytics || analytics.dailyByType.length === 0) return [];
    const sample = analytics.dailyByType[0];
    return Object.keys(sample).filter((k) => k !== "date");
  }, [analytics]);

  if (loading) {
    return (
      <>
        <Header title="Analytics" />
        <div className="space-y-6 p-6">
          {/* Insights skeleton */}
          <div className="rounded-xl border bg-card p-5">
            <div className="h-4 w-20 rounded skeleton-shimmer mb-4" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="h-4 w-4 rounded skeleton-shimmer mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-24 rounded skeleton-shimmer" />
                    <div className="h-4 w-16 rounded skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Chart skeletons */}
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="flex justify-between mb-4">
                <div className="h-4 w-36 rounded skeleton-shimmer" />
                {i === 0 && <div className="h-7 w-48 rounded-lg skeleton-shimmer" />}
              </div>
              <div className="h-[280px] rounded skeleton-shimmer" />
            </div>
          ))}
          <div className="grid gap-6 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <div className="h-4 w-24 rounded skeleton-shimmer mb-4" />
                <div className="h-[280px] rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!analytics) return null;

  const pieData = analytics.byType.map((t) => ({
    name: typeConfig[t.type as ContributionType]?.label || t.type,
    value: t.count,
    fill: typeColors[t.type as ContributionType] || "#6b7280",
  }));

  const hourData = analytics.byHourOfDay.map((h) => ({
    hour: `${h.hour.toString().padStart(2, "0")}:00`,
    count: h.count,
  }));

  const monthlyData = analytics.monthly.map((m) => {
    const [year, month] = m.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      count: m.count,
    };
  });

  return (
    <>
      <Header title="Analytics" />
      <div className="space-y-6 p-6">
        {/* Insights */}
        {analytics.insights && analytics.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="mt-0.5">
                      {insight.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : insight.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{insight.label}</p>
                      <p className="text-sm font-semibold">{insight.value}</p>
                      {insight.detail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contribution Trend with time range selector */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contribution Trend</CardTitle>
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                {TIME_RANGES.map((range) => (
                  <Button
                    key={range.label}
                    variant={rangeDays === range.days ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setRangeDays(range.days)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDaily.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={filteredDaily}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={filteredDaily.length <= 31 ? { r: 3, fill: "#10b981" } : false}
                    activeDot={{ r: 5 }}
                    name="Contributions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Contribution Types Over Time (Stacked Area) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contributions by Type Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDailyByType.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={filteredDailyByType}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  {contributionTypes.map((type) => (
                    <Area
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stackId="1"
                      stroke={typeColors[type as ContributionType] || "#6b7280"}
                      fill={typeColors[type as ContributionType] || "#6b7280"}
                      fillOpacity={0.6}
                      name={typeConfig[type as ContributionType]?.label || type}
                    />
                  ))}
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Type Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Type</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Day of Week */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Day of Week</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.byDayOfWeek.every((d) => d.count === 0) ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.byDayOfWeek.map((d) => ({ ...d, day: d.day.substring(0, 3) }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Contributions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hour of Day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                By Hour of Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hourData.every((h) => h.count === 0) ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hourData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Contributions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Contributions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Punch Card */}
        <PunchCard data={analytics.punchCard} />

        {/* Top Repos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byRepo.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.byRepo.length * 40)}>
                <BarChart data={analytics.byRepo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="repo"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    width={200}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Contributions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
