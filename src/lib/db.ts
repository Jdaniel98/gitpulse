import Database from "better-sqlite3";
import path from "path";
import type { Contribution, ContributionInsert, DayCount, TypeCount, RepoCount, Goal } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "tracker.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      repo TEXT,
      url TEXT,
      source TEXT NOT NULL,
      github_id TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
    CREATE INDEX IF NOT EXISTS idx_contributions_type ON contributions(type);
    CREATE INDEX IF NOT EXISTS idx_contributions_github_id ON contributions(github_id);
    CREATE INDEX IF NOT EXISTS idx_contributions_repo ON contributions(repo);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      target INTEGER NOT NULL,
      period TEXT NOT NULL DEFAULT 'daily'
    );
  `);
}

export function insertContribution(data: ContributionInsert): Contribution {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO contributions (type, title, description, repo, url, source, github_id, created_at, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.type,
    data.title,
    data.description || null,
    data.repo || null,
    data.url || null,
    data.source,
    data.github_id || null,
    data.created_at,
    data.synced_at || null
  );
  return getContributionById(Number(result.lastInsertRowid))!;
}

export function insertContributions(items: ContributionInsert[]): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO contributions (type, title, description, repo, url, source, github_id, created_at, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: ContributionInsert[]) => {
    let count = 0;
    for (const item of items) {
      const result = stmt.run(
        item.type,
        item.title,
        item.description || null,
        item.repo || null,
        item.url || null,
        item.source,
        item.github_id || null,
        item.created_at,
        item.synced_at || null
      );
      if (result.changes > 0) count++;
    }
    return count;
  });

  return insertMany(items);
}

export function getContributionById(id: number): Contribution | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM contributions WHERE id = ?").get(id) as Contribution | undefined;
}

export function getContributions(options: {
  limit?: number;
  offset?: number;
  type?: string;
  repo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
} = {}): { data: Contribution[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.type && options.type !== "all") {
    conditions.push("type = ?");
    params.push(options.type);
  }
  if (options.repo) {
    conditions.push("repo = ?");
    params.push(options.repo);
  }
  if (options.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${options.search}%`, `%${options.search}%`);
  }
  if (options.startDate) {
    conditions.push("created_at >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("created_at <= ?");
    params.push(options.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM contributions ${where}`).get(...params) as { count: number }).count;
  const data = db.prepare(`SELECT * FROM contributions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Contribution[];

  return { data, total };
}

export function deleteContribution(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM contributions WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteContributions(ids: number[]): number {
  const db = getDb();
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(`DELETE FROM contributions WHERE id IN (${placeholders})`).run(...ids);
  return result.changes;
}

export function getDailyCounts(days: number = 365): DayCount[] {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];

  return db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM contributions
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(startStr) as DayCount[];
}

export function getTypeCounts(): TypeCount[] {
  const db = getDb();
  return db.prepare(`
    SELECT type, COUNT(*) as count
    FROM contributions
    GROUP BY type
    ORDER BY count DESC
  `).all() as TypeCount[];
}

export function getRepoCounts(limit: number = 10): RepoCount[] {
  const db = getDb();
  return db.prepare(`
    SELECT repo, COUNT(*) as count
    FROM contributions
    WHERE repo IS NOT NULL
    GROUP BY repo
    ORDER BY count DESC
    LIMIT ?
  `).all(limit) as RepoCount[];
}

export function getDayOfWeekCounts(): { day: string; count: number }[] {
  const db = getDb();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const rows = db.prepare(`
    SELECT CAST(strftime('%w', created_at) AS INTEGER) as day_num, COUNT(*) as count
    FROM contributions
    GROUP BY day_num
    ORDER BY day_num
  `).all() as { day_num: number; count: number }[];

  return dayNames.map((day, i) => ({
    day,
    count: rows.find((r) => r.day_num === i)?.count || 0,
  }));
}

export function getTotalCount(): number {
  const db = getDb();
  return (db.prepare("SELECT COUNT(*) as count FROM contributions").get() as { count: number }).count;
}

export function getUniqueRepos(): string[] {
  const db = getDb();
  return (db.prepare("SELECT DISTINCT repo FROM contributions WHERE repo IS NOT NULL ORDER BY repo").all() as { repo: string }[]).map(r => r.repo);
}

export function hasGithubId(githubId: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT 1 FROM contributions WHERE github_id = ?").get(githubId);
  return !!row;
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// Goals
export function getGoals(): Goal[] {
  const db = getDb();
  return db.prepare("SELECT * FROM goals").all() as Goal[];
}

export function upsertGoal(goal: Goal): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO goals (id, label, target, period) VALUES (?, ?, ?, ?)").run(goal.id, goal.label, goal.target, goal.period);
}

export function deleteGoal(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM goals WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getTodayCount(): number {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE DATE(created_at) = ?").get(today) as { count: number }).count;
}

export function getWeekCount(): number {
  const db = getDb();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE created_at >= ?").get(startOfWeek.toISOString()) as { count: number }).count;
}

export function getThisWeekDailyCounts(): DayCount[] {
  const db = getDb();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startStr = startOfWeek.toISOString().split("T")[0];
  return db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM contributions
    WHERE DATE(created_at) >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(startStr) as DayCount[];
}

export function getLastWeekCount(): number {
  const db = getDb();
  const now = new Date();
  const startOfLastWeek = new Date(now);
  startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
  const endOfLastWeek = new Date(now);
  endOfLastWeek.setDate(now.getDate() - now.getDay());
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE created_at >= ? AND created_at < ?").get(startOfLastWeek.toISOString(), endOfLastWeek.toISOString()) as { count: number }).count;
}

export function getMonthlyCounts(months: number = 12): { month: string; count: number }[] {
  const db = getDb();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startStr = startDate.toISOString().split("T")[0];
  return db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM contributions
    WHERE created_at >= ?
    GROUP BY month
    ORDER BY month ASC
  `).all(startStr) as { month: string; count: number }[];
}

export function getHourOfDayCounts(): { hour: number; count: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
    FROM contributions
    GROUP BY hour
    ORDER BY hour
  `).all() as { hour: number; count: number }[];

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: rows.find((r) => r.hour === i)?.count || 0,
  }));
}

export function getPunchCardData(): { dayOfWeek: number; hour: number; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      CAST(strftime('%w', created_at) AS INTEGER) as dayOfWeek,
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM contributions
    GROUP BY dayOfWeek, hour
    ORDER BY dayOfWeek, hour
  `).all() as { dayOfWeek: number; hour: number; count: number }[];
}

export function getDailyCountsByType(days: number = 365): { date: string; type: string; count: number }[] {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];
  return db.prepare(`
    SELECT DATE(created_at) as date, type, COUNT(*) as count
    FROM contributions
    WHERE created_at >= ?
    GROUP BY DATE(created_at), type
    ORDER BY date ASC
  `).all(startStr) as { date: string; type: string; count: number }[];
}

export function getContributionsForExport(options: {
  type?: string;
  repo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
} = {}): Contribution[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: string[] = [];

  if (options.type && options.type !== "all") {
    conditions.push("type = ?");
    params.push(options.type);
  }
  if (options.repo) {
    conditions.push("repo = ?");
    params.push(options.repo);
  }
  if (options.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${options.search}%`, `%${options.search}%`);
  }
  if (options.startDate) {
    conditions.push("created_at >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("created_at <= ?");
    params.push(options.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM contributions ${where} ORDER BY created_at DESC`).all(...params) as Contribution[];
}
