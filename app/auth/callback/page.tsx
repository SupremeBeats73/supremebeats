"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

/**
 * OAuth callback: Supabase redirects here after Google/Apple/Facebook sign-in.
 * Recovers the session from the URL and redirects to dashboard.
 * If Supabase returns an error (e.g. redirect URL not allowed), we show it here.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        if (typeof window === "undefined") return;

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        const errorDesc = url.searchParams.get("error_description");

        // Supabase redirects here with ?error=... when e.g. redirect URL is not whitelisted
        if (errorParam && mounted) {
          setStatus("error");
          setErrorMessage(
            errorDesc
              ? errorDesc
              : errorParam === "access_denied"
                ? "Sign-in was cancelled or denied."
                : "Sign-in failed. See setup instructions below."
          );
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError && mounted) {
            setStatus("error");
            setErrorMessage(exchangeError.message);
            return;
          }
          if (!exchangeError && mounted) {
            setStatus("done");
            router.replace("/dashboard");
            router.refresh();
            return;
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
          if (mounted) setStatus("done");
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        if (window.location.hash) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (!setErr && mounted) {
              setStatus("done");
              window.history.replaceState(null, "", window.location.pathname);
              router.replace("/dashboard");
              router.refresh();
              return;
            }
          }
        }

        if (mounted) {
          setStatus("error");
          setErrorMessage("No session or code received. Add the redirect URL in Supabase (see below).");
        }
      } catch (e) {
        if (mounted) {
          setStatus("error");
          setErrorMessage(e instanceof Error ? e.message : "Something went wrong.");
        }
      }
    }

    handleCallback();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (status === "error") {
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "/auth/callback";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#050508] px-4">
        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-lg font-semibold text-white">Sign-in didn’t complete</h1>
          {errorMessage && (
            <p className="mt-2 text-sm text-[var(--muted)]">{errorMessage}</p>
          )}
          <p className="mt-4 text-xs text-[var(--muted)]">
            If you saw &quot;invalid response&quot; from Supabase, add this exact URL in your
            Supabase project:{" "}
            <strong className="break-all text-[var(--neon-green)]">{callbackUrl}</strong>
            {" "}
            under <strong>Authentication → URL Configuration → Redirect URLs</strong>. Then
            enable Google (or Apple/Facebook) under <strong>Authentication → Providers</strong>.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Back to Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050508]">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--neon-green)] border-t-transparent"
        style={{ boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
      />
      <p className="text-sm text-[var(--muted)]">Signing you in…</p>
    </div>
  );
}
