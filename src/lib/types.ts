export type ContributionType =
  | "commit"
  | "pr"
  | "issue"
  | "review"
  | "star"
  | "fork"
  | "manual";

export type ContributionSource = "github_api" | "manual";

export interface Contribution {
  id: number;
  type: ContributionType;
  title: string;
  description: string | null;
  repo: string | null;
  url: string | null;
  source: ContributionSource;
  github_id: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface ContributionInsert {
  type: ContributionType;
  title: string;
  description?: string;
  repo?: string;
  url?: string;
  source: ContributionSource;
  github_id?: string;
  created_at: string;
  synced_at?: string;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface TypeCount {
  type: ContributionType;
  count: number;
}

export interface RepoCount {
  repo: string;
  count: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  todayCount: number;
}

export interface Goal {
  id: string;
  label: string;
  target: number;
  period: "daily" | "weekly";
}

export interface GoalProgress extends Goal {
  current: number;
  percentage: number;
}

export interface Insight {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "neutral";
}

export interface PunchCardCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface AnalyticsData {
  daily: DayCount[];
  byType: TypeCount[];
  byRepo: RepoCount[];
  byDayOfWeek: { day: string; count: number }[];
  byHourOfDay: { hour: number; count: number }[];
  monthly: { month: string; count: number }[];
  dailyByType: { date: string; [key: string]: string | number }[];
  punchCard: PunchCardCell[];
  total: number;
  streak: StreakInfo;
  insights: Insight[];
}
