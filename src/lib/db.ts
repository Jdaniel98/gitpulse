import Database from "better-sqlite3";
import path from "path";
import type { Contribution, ContributionInsert, DayCount, TypeCount, RepoCount, Goal } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "tracker.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
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

    -- Auth tables
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      emailVerified TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, providerAccountId)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sessionToken TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TEXT NOT NULL,
      UNIQUE(identifier, token)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT NOT NULL REFERENCES users(id),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY(user_id, key)
    );
  `);

  // Add user_id columns to existing tables (idempotent)
  try {
    db.exec(`ALTER TABLE contributions ADD COLUMN user_id TEXT REFERENCES users(id)`);
  } catch {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE goals ADD COLUMN user_id TEXT REFERENCES users(id)`);
  } catch {
    // Column already exists
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
  `);
}

// --- Auth data claim ---

export function claimOrphanedData(userId: string): void {
  const db = getDb();
  db.prepare("UPDATE contributions SET user_id = ? WHERE user_id IS NULL").run(userId);
  db.prepare("UPDATE goals SET user_id = ? WHERE user_id IS NULL").run(userId);
}

// --- Contributions ---

export function insertContribution(data: ContributionInsert, userId: string): Contribution {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO contributions (type, title, description, repo, url, source, github_id, created_at, synced_at, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.synced_at || null,
    userId
  );
  return getContributionById(Number(result.lastInsertRowid))!;
}

export function insertContributions(items: ContributionInsert[], userId: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO contributions (type, title, description, repo, url, source, github_id, created_at, synced_at, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        item.synced_at || null,
        userId
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

export function getContributions(userId: string, options: {
  limit?: number;
  offset?: number;
  type?: string;
  repo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
} = {}): { data: Contribution[]; total: number } {
  const db = getDb();
  const conditions: string[] = ["user_id = ?"];
  const params: (string | number)[] = [userId];

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

  const where = `WHERE ${conditions.join(" AND ")}`;
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM contributions ${where}`).get(...params) as { count: number }).count;
  const data = db.prepare(`SELECT * FROM contributions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Contribution[];

  return { data, total };
}

export function deleteContribution(id: number, userId: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM contributions WHERE id = ? AND user_id = ?").run(id, userId);
  return result.changes > 0;
}

export function deleteContributions(ids: number[], userId: string): number {
  const db = getDb();
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const result = db.prepare(`DELETE FROM contributions WHERE id IN (${placeholders}) AND user_id = ?`).run(...ids, userId);
  return result.changes;
}

export function getDailyCounts(userId: string, days: number = 365): DayCount[] {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];

  return db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM contributions
    WHERE created_at >= ? AND user_id = ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(startStr, userId) as DayCount[];
}

export function getTypeCounts(userId: string): TypeCount[] {
  const db = getDb();
  return db.prepare(`
    SELECT type, COUNT(*) as count
    FROM contributions
    WHERE user_id = ?
    GROUP BY type
    ORDER BY count DESC
  `).all(userId) as TypeCount[];
}

export function getRepoCounts(userId: string, limit: number = 10): RepoCount[] {
  const db = getDb();
  return db.prepare(`
    SELECT repo, COUNT(*) as count
    FROM contributions
    WHERE repo IS NOT NULL AND user_id = ?
    GROUP BY repo
    ORDER BY count DESC
    LIMIT ?
  `).all(userId, limit) as RepoCount[];
}

export function getDayOfWeekCounts(userId: string): { day: string; count: number }[] {
  const db = getDb();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const rows = db.prepare(`
    SELECT CAST(strftime('%w', created_at) AS INTEGER) as day_num, COUNT(*) as count
    FROM contributions
    WHERE user_id = ?
    GROUP BY day_num
    ORDER BY day_num
  `).all(userId) as { day_num: number; count: number }[];

  return dayNames.map((day, i) => ({
    day,
    count: rows.find((r) => r.day_num === i)?.count || 0,
  }));
}

export function getTotalCount(userId: string): number {
  const db = getDb();
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE user_id = ?").get(userId) as { count: number }).count;
}

export function getUniqueRepos(userId: string): string[] {
  const db = getDb();
  return (db.prepare("SELECT DISTINCT repo FROM contributions WHERE repo IS NOT NULL AND user_id = ? ORDER BY repo").all(userId) as { repo: string }[]).map(r => r.repo);
}

export function hasGithubId(githubId: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT 1 FROM contributions WHERE github_id = ?").get(githubId);
  return !!row;
}

// --- Per-user settings ---

export function getUserSetting(userId: string, key: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM user_settings WHERE user_id = ? AND key = ?").get(userId, key) as { value: string } | undefined;
  return row?.value || null;
}

export function setUserSetting(userId: string, key: string, value: string): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)").run(userId, key, value);
}

export function getAllUserSettings(userId: string): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM user_settings WHERE user_id = ?").all(userId) as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// --- Goals ---

export function getGoals(userId: string): Goal[] {
  const db = getDb();
  return db.prepare("SELECT id, label, target, period FROM goals WHERE user_id = ?").all(userId) as Goal[];
}

export function upsertGoal(goal: Goal, userId: string): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO goals (id, label, target, period, user_id) VALUES (?, ?, ?, ?, ?)").run(goal.id, goal.label, goal.target, goal.period, userId);
}

export function deleteGoal(id: string, userId: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM goals WHERE id = ? AND user_id = ?").run(id, userId);
  return result.changes > 0;
}

export function getTodayCount(userId: string): number {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE DATE(created_at) = ? AND user_id = ?").get(today, userId) as { count: number }).count;
}

export function getWeekCount(userId: string): number {
  const db = getDb();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE created_at >= ? AND user_id = ?").get(startOfWeek.toISOString(), userId) as { count: number }).count;
}

export function getThisWeekDailyCounts(userId: string): DayCount[] {
  const db = getDb();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startStr = startOfWeek.toISOString().split("T")[0];
  return db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM contributions
    WHERE DATE(created_at) >= ? AND user_id = ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(startStr, userId) as DayCount[];
}

export function getLastWeekCount(userId: string): number {
  const db = getDb();
  const now = new Date();
  const startOfLastWeek = new Date(now);
  startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
  const endOfLastWeek = new Date(now);
  endOfLastWeek.setDate(now.getDate() - now.getDay());
  return (db.prepare("SELECT COUNT(*) as count FROM contributions WHERE created_at >= ? AND created_at < ? AND user_id = ?").get(startOfLastWeek.toISOString(), endOfLastWeek.toISOString(), userId) as { count: number }).count;
}

export function getMonthlyCounts(userId: string, months: number = 12): { month: string; count: number }[] {
  const db = getDb();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startStr = startDate.toISOString().split("T")[0];
  return db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM contributions
    WHERE created_at >= ? AND user_id = ?
    GROUP BY month
    ORDER BY month ASC
  `).all(startStr, userId) as { month: string; count: number }[];
}

export function getHourOfDayCounts(userId: string): { hour: number; count: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
    FROM contributions
    WHERE user_id = ?
    GROUP BY hour
    ORDER BY hour
  `).all(userId) as { hour: number; count: number }[];

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: rows.find((r) => r.hour === i)?.count || 0,
  }));
}

export function getPunchCardData(userId: string): { dayOfWeek: number; hour: number; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      CAST(strftime('%w', created_at) AS INTEGER) as dayOfWeek,
      CAST(strftime('%H', created_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM contributions
    WHERE user_id = ?
    GROUP BY dayOfWeek, hour
    ORDER BY dayOfWeek, hour
  `).all(userId) as { dayOfWeek: number; hour: number; count: number }[];
}

export function getDailyCountsByType(userId: string, days: number = 365): { date: string; type: string; count: number }[] {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];
  return db.prepare(`
    SELECT DATE(created_at) as date, type, COUNT(*) as count
    FROM contributions
    WHERE created_at >= ? AND user_id = ?
    GROUP BY DATE(created_at), type
    ORDER BY date ASC
  `).all(startStr, userId) as { date: string; type: string; count: number }[];
}

export function getContributionsForExport(userId: string, options: {
  type?: string;
  repo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
} = {}): Contribution[] {
  const db = getDb();
  const conditions: string[] = ["user_id = ?"];
  const params: string[] = [userId];

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

  const where = `WHERE ${conditions.join(" AND ")}`;
  return db.prepare(`SELECT * FROM contributions ${where} ORDER BY created_at DESC`).all(...params) as Contribution[];
}
