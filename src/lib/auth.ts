import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { SQLiteAdapter } from "./auth-adapter";

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
});
