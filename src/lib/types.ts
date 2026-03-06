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

export interface AnalyticsData {
  daily: DayCount[];
  byType: TypeCount[];
  byRepo: RepoCount[];
  byDayOfWeek: { day: string; count: number }[];
  total: number;
  streak: StreakInfo;
}
