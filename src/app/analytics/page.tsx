"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-contributions";
import { typeColors } from "@/lib/contribution-utils";
import { typeConfig } from "@/lib/contribution-utils";
import type { ContributionType } from "@/lib/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const { data: analytics, loading } = useAnalytics();

  if (loading) {
    return (
      <>
        <Header title="Analytics" />
        <div className="space-y-6 p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </>
    );
  }

  if (!analytics) return null;

  // Prepare 30-day trend data
  const last30 = analytics.daily.slice(-30).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const pieData = analytics.byType.map((t) => ({
    name: typeConfig[t.type as ContributionType]?.label || t.type,
    value: t.count,
    fill: typeColors[t.type as ContributionType] || "#6b7280",
  }));

  return (
    <>
      <Header title="Analytics" />
      <div className="space-y-6 p-6">
        {/* Contribution Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contribution Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {last30.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={last30}>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#10b981" }}
                    activeDot={{ r: 5 }}
                    name="Contributions"
                  />
                </LineChart>
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Contributions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
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
