import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { db } from "@/db";
import { users, nodeMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        const isValid = compareSync(password, user.passwordHash);
        if (!isValid) return null;

        // Find active node membership (if any)
        const [membership] = await db
          .select()
          .from(nodeMembers)
          .where(
            and(
              eq(nodeMembers.userId, user.id),
              eq(nodeMembers.status, "active")
            )
          )
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          nodeId: membership?.nodeId ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.nodeId = (user as { nodeId: string | null }).nodeId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.nodeId = token.nodeId as string | null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
