import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Next.js 16+ network proxy (replaces `middleware.ts`): refreshes Supabase auth cookies
 * on every matched request via @supabase/ssr.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip auth routes: running updateSession (getUser) before /auth/callback can
     * interfere with PKCE verifier cookies during OAuth code exchange.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
