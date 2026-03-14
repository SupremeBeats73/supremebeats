"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

/**
 * OAuth callback: Supabase redirects here after Google/Apple/Facebook sign-in.
 * Recovers the session from the URL and redirects to dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        if (typeof window === "undefined") return;

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
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

        if (mounted) setStatus("error");
        router.replace("/login?error=callback");
      } catch {
        if (mounted) setStatus("error");
        router.replace("/login?error=callback");
      }
    }

    handleCallback();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508]">
        <p className="text-[var(--muted)]">Something went wrong. Redirecting to login…</p>
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
