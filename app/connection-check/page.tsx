"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CheckResult = {
  ok: boolean;
  checks: {
    siteUrl: string | null;
    siteUrlSet: boolean;
    currentHost: string | null;
    isLikelyProduction: boolean;
    supabaseUrlSet: boolean;
    supabaseReachable: boolean | null;
    supabaseAnonKeySet: boolean;
    vercel: boolean;
    vercelUrl: string | null;
  };
  summary?: { siteUrlMatch: boolean | null };
} | null;

export default function ConnectionCheckPage() {
  const [result, setResult] = useState<CheckResult>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/connection-check")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setResult(data);
      })
      .catch((e) => {
        if (mounted) setError(e.message || "Request failed");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4">
        <p className="text-[var(--muted)]">Checking connections…</p>
      </div>
    );
  }

  if (error || !result?.ok || !result?.checks) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <h1 className="text-lg font-semibold text-white">Connection check failed</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{error || "Invalid response"}</p>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Make sure you’re running the app (localhost or deployed) and that <code className="rounded bg-white/10 px-1">/api/connection-check</code> is reachable.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-[var(--neon-green)] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const c = result.checks ?? {};

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-white">Connection check</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Safe status of Vercel, Supabase, and site URL. No secrets are shown.
        </p>

        <ul className="mt-8 space-y-4">
          <CheckItem
            label="Site URL (NEXT_PUBLIC_SITE_URL)"
            ok={c.siteUrlSet}
            detail={c.siteUrl || "Not set"}
          />
          <CheckItem
            label="Current host (where you opened this page)"
            ok={true}
            detail={c.currentHost || "Unknown"}
          />
          <CheckItem
            label="Supabase URL configured"
            ok={c.supabaseUrlSet}
            detail={c.supabaseUrlSet ? "Yes" : "No — set NEXT_PUBLIC_SUPABASE_URL"}
          />
          <CheckItem
            label="Supabase anon key configured"
            ok={c.supabaseAnonKeySet}
            detail={c.supabaseAnonKeySet ? "Yes" : "No — set NEXT_PUBLIC_SUPABASE_ANON_KEY"}
          />
          <CheckItem
            label="Supabase reachable"
            ok={c.supabaseReachable === true}
            detail={
              c.supabaseReachable === true
                ? "Yes"
                : c.supabaseReachable === false
                  ? "No — check URL and network"
                  : "Skipped (no URL)"
            }
          />
          <CheckItem
            label="Running on Vercel"
            ok={c.vercel}
            detail={c.vercel ? `Yes (${c.vercelUrl || "deployed"})` : "No — local or other host"}
          />
          <CheckItem
            label="Site URL matches current host (for OAuth redirects)"
            ok={result.summary?.siteUrlMatch === true}
            detail={
              result.summary?.siteUrlMatch === true
                ? "Yes — good for production"
                : result.summary?.siteUrlMatch === false
                  ? "No — set NEXT_PUBLIC_SITE_URL to your current domain for OAuth"
                  : "N/A"
            }
          />
        </ul>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--muted)]">
          <p className="font-medium text-white">Quick checklist</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Localhost:</strong> Open this page at <code>http://localhost:3000/connection-check</code>. Current host should be <code>localhost:3000</code>. For Google OAuth locally, add <code>http://localhost:3000/auth/callback</code> in Google Cloud Console.
            </li>
            <li>
              <strong>Production (supremebeatsstudio.com):</strong> Open <code>https://supremebeatsstudio.com/connection-check</code>. Site URL should match, Supabase reachable Yes, and “Site URL matches current host” Yes.
            </li>
            <li>
              <strong>Vercel:</strong> In Vercel dashboard, confirm the project is linked to your GitHub repo and that env vars (NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_*) are set for Production.
            </li>
            <li>
              <strong>Supabase:</strong> In Authentication → URL Configuration, add your Site URL and Redirect URLs (e.g. <code>https://supremebeatsstudio.com/auth/callback</code>, <code>https://supremebeatsstudio.com/auth/confirm</code>).
            </li>
          </ul>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Dashboard
          </Link>
        </div>

        <p className="mt-8 text-xs text-[var(--muted)]">
          You can delete this page and <code>/api/connection-check</code> later if you don’t need them.
        </p>
      </div>
    </div>
  );
}

function CheckItem({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-white/10 bg-[var(--card-bg)] p-3">
      <span
        className="mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: ok ? "var(--neon-green)" : "rgba(239,68,68,0.2)",
          color: ok ? "black" : "#ef4444",
        }}
      >
        {ok ? "✓" : "!"}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-white">{label}</p>
        <p className="mt-0.5 text-sm text-[var(--muted)] break-all">{detail}</p>
      </div>
    </li>
  );
}
