import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { SQLiteAdapter } from "./auth-adapter";
import { claimOrphanedData } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: SQLiteAdapter(),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    createUser({ user }) {
      if (user.id) {
        claimOrphanedData(user.id);
      }
    },
  },
});
