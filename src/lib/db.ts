import Database from "better-sqlite3";
import path from "path";
import type { Contribution, ContributionInsert, DayCount, TypeCount, RepoCount } from "./types";

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
