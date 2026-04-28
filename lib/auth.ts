import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAIN = "zoca.com";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          // Hint Google to only show / accept the Zoca workspace.
          hd: ALLOWED_DOMAIN
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7 // 1 week
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = (user?.email || (profile as any)?.email || "").toLowerCase();
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) return false;
      // Google's `hd` claim is the workspace domain — defense-in-depth alongside the email check.
      const hd = (profile as any)?.hd as string | undefined;
      if (hd && hd.toLowerCase() !== ALLOWED_DOMAIN) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) session.user.email = token.email as string;
      return session;
    }
  }
};
