import { NextResponse } from "next/server";

/**
 * GET /api/connection-check
 * Safe status of env and connections (no secrets). Use to verify Vercel, Supabase, and site URL.
 */
export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let supabaseReachable: boolean | null = null;
  if (supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
        method: "HEAD",
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
      });
      supabaseReachable = res.status < 500;
    } catch {
      supabaseReachable = false;
    }
  }

  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || null;
  const isVercel = process.env.VERCEL === "1";

  return NextResponse.json({
    ok: true,
    checks: {
      siteUrl: siteUrl || null,
      siteUrlSet: Boolean(siteUrl),
      currentHost: host,
      isLikelyProduction: host !== "localhost:3000" && host !== "127.0.0.1:3000",
      supabaseUrlSet: Boolean(supabaseUrl),
      supabaseReachable,
      supabaseAnonKeySet: hasAnonKey,
      vercel: isVercel,
      vercelUrl: process.env.VERCEL_URL || null,
    },
    summary: {
      siteUrlMatch: host && siteUrl ? siteUrl.includes(host.split(":")[0]) : null,
    },
  });
}
