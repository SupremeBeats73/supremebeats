import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// NOTE: Current auth is handled client-side via Supabase JS (localStorage-based session).
// This middleware is a non-breaking scaffold: it can be extended later to use a
// cookie-based Supabase session (e.g. with @supabase/ssr) without changing routes.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only consider dashboard/admin-like routes.
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!isProtected) {
    return NextResponse.next();
  }

  // At this stage, we don't have a reliable server-visible Supabase session
  // (Supabase JS stores sessions in localStorage on the client), so we avoid
  // enforcing redirects here to prevent breaking the existing client-side auth.
  // DashboardShell/AdminLayout continue to guard routes on the client.

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};

