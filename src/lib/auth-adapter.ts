import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "next-auth/adapters";
import { getDb } from "./db";
import crypto from "crypto";

export function SQLiteAdapter(): Adapter {
  return {
    createUser(user) {
      const db = getDb();
      const id = crypto.randomUUID();
      db.prepare(
        "INSERT INTO users (id, name, email, emailVerified, image) VALUES (?, ?, ?, ?, ?)"
      ).run(id, user.name ?? null, user.email, user.emailVerified?.toISOString() ?? null, user.image ?? null);
      return { ...user, id } as AdapterUser;
    },

    getUser(id) {
      const db = getDb();
      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
      if (!row) return null;
      return formatUser(row);
    },

    getUserByEmail(email) {
      const db = getDb();
      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined;
      if (!row) return null;
      return formatUser(row);
    },

    getUserByAccount({ providerAccountId, provider }) {
      const db = getDb();
      const account = db.prepare(
        "SELECT * FROM accounts WHERE provider = ? AND providerAccountId = ?"
      ).get(provider, providerAccountId) as Record<string, unknown> | undefined;
      if (!account) return null;
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(account.userId) as Record<string, unknown> | undefined;
      if (!user) return null;
      return formatUser(user);
    },

    updateUser(user) {
      const db = getDb();
      const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as Record<string, unknown>;
      db.prepare(
        "UPDATE users SET name = ?, email = ?, emailVerified = ?, image = ? WHERE id = ?"
      ).run(
        user.name ?? existing.name,
        user.email ?? existing.email,
        user.emailVerified?.toISOString() ?? (existing.emailVerified as string | null),
        user.image ?? existing.image,
        user.id
      );
      const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as Record<string, unknown>;
      return formatUser(updated);
    },

    async deleteUser(userId) {
      const db = getDb();
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    },

    linkAccount(account) {
      const db = getDb();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO accounts (id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        account.userId,
        account.type,
        account.provider,
        account.providerAccountId,
        account.refresh_token ?? null,
        account.access_token ?? null,
        account.expires_at ?? null,
        account.token_type ?? null,
        account.scope ?? null,
        account.id_token ?? null,
        account.session_state ?? null
      );
      return account as AdapterAccount;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      const db = getDb();
      db.prepare(
        "DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?"
      ).run(provider, providerAccountId);
    },

    createSession(session) {
      const db = getDb();
      db.prepare(
        "INSERT INTO sessions (sessionToken, userId, expires) VALUES (?, ?, ?)"
      ).run(session.sessionToken, session.userId, session.expires.toISOString());
      return session as AdapterSession;
    },

    getSessionAndUser(sessionToken) {
      const db = getDb();
      const session = db.prepare("SELECT * FROM sessions WHERE sessionToken = ?").get(sessionToken) as Record<string, unknown> | undefined;
      if (!session) return null;
      const expires = new Date(session.expires as string);
      if (expires < new Date()) {
        db.prepare("DELETE FROM sessions WHERE sessionToken = ?").run(sessionToken);
        return null;
      }
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.userId) as Record<string, unknown> | undefined;
      if (!user) return null;
      return {
        session: { sessionToken: session.sessionToken as string, userId: session.userId as string, expires },
        user: formatUser(user),
      };
    },

    updateSession(session) {
      const db = getDb();
      if (session.expires) {
        db.prepare("UPDATE sessions SET expires = ? WHERE sessionToken = ?").run(
          session.expires.toISOString(),
          session.sessionToken
        );
      }
      const updated = db.prepare("SELECT * FROM sessions WHERE sessionToken = ?").get(session.sessionToken) as Record<string, unknown> | undefined;
      if (!updated) return null;
      return {
        sessionToken: updated.sessionToken as string,
        userId: updated.userId as string,
        expires: new Date(updated.expires as string),
      };
    },

    async deleteSession(sessionToken) {
      const db = getDb();
      db.prepare("DELETE FROM sessions WHERE sessionToken = ?").run(sessionToken);
    },

    createVerificationToken(token) {
      const db = getDb();
      db.prepare(
        "INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)"
      ).run(token.identifier, token.token, token.expires.toISOString());
      return token;
    },

    useVerificationToken({ identifier, token }) {
      const db = getDb();
      const row = db.prepare(
        "SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?"
      ).get(identifier, token) as Record<string, unknown> | undefined;
      if (!row) return null;
      db.prepare(
        "DELETE FROM verification_tokens WHERE identifier = ? AND token = ?"
      ).run(identifier, token);
      return {
        identifier: row.identifier as string,
        token: row.token as string,
        expires: new Date(row.expires as string),
      };
    },
  };
}

function formatUser(row: Record<string, unknown>): AdapterUser {
  return {
    id: row.id as string,
    name: row.name as string | null,
    email: row.email as string,
    emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null,
    image: row.image as string | null,
  };
}
