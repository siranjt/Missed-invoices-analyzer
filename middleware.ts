import { withAuth } from "next-auth/middleware";

// Gate the entire app behind a Google sign-in restricted to @zoca.com.
// `signIn` callback in lib/auth.ts already enforces the domain — the JWT
// here just needs to exist for the session to be considered valid.
export default withAuth({
  pages: {
    signIn: "/auth/signin"
  }
});

export const config = {
  matcher: [
    // Protect everything except:
    //   - /api/auth/*       → NextAuth itself
    //   - /api/cron/*       → cron warm-ups (auth via CRON_SECRET header)
    //   - /auth/*           → sign-in / error pages
    //   - Next internals + favicon + static assets
    "/((?!api/auth|api/cron|auth|_next/static|_next/image|favicon.ico).*)"
  ]
};
