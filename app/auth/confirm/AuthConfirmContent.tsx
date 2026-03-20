"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const pageStyle = {
  background:
    "linear-gradient(135deg, #050508 0%, #0f0a1a 25%, #1a0f2e 50%, #0a1810 75%, #050508 100%)",
  backgroundSize: "400% 400%",
  animation: "gradient-shift 18s ease infinite",
};

export default function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"loading" | "confirmed_redirect" | "confirmed_manual">("loading");

  useEffect(() => {
    let mounted = true;

    async function confirmAndRedirect() {
      if (typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") || "email";

      // 1) PKCE: code in query
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && mounted) {
          setStatus("confirmed_redirect");
          setTimeout(() => {
            router.replace("/dashboard");
            router.refresh();
          }, 2000);
          return;
        }
      }

      // 2) Email confirm: token_hash (works cross-browser)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" });
        if (!error && mounted) {
          setStatus("confirmed_redirect");
          setTimeout(() => {
            router.replace("/dashboard");
            router.refresh();
          }, 2000);
          return;
        }
      }

      // 3) Hash fragment tokens (implicit flow)
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error && mounted) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            setStatus("confirmed_redirect");
            setTimeout(() => {
              router.replace("/dashboard");
              router.refresh();
            }, 2000);
            return;
          }
        }
      }

      // 4) Already have a session (e.g. refreshed after confirm)
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        setStatus("confirmed_redirect");
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 2000);
        return;
      }

      if (mounted) setStatus("confirmed_manual");
    }

    confirmAndRedirect();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={pageStyle}
    >
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Email confirmed
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {status === "loading" && "Confirming your email…"}
          {status === "confirmed_redirect" &&
            "Your SupremeBeats account is confirmed. Redirecting you to your dashboard…"}
          {status === "confirmed_manual" &&
            "Your SupremeBeats account is confirmed. You can now log in and start creating."}
        </p>

        {status === "loading" && (
          <div className="mt-8 flex justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--neon-green)] border-t-transparent"
              style={{ boxShadow: "0 0 20px rgba(34,197,94,0.3)" }}
            />
          </div>
        )}

        {status === "confirmed_redirect" && (
          <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
            <p className="text-sm text-[var(--muted)]">
              Taking you to your dashboard in a moment…
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-[var(--neon-green)] hover:underline"
            >
              Go to dashboard now
            </Link>
          </div>
        )}

        {status === "confirmed_manual" && (
          <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
            <p className="text-sm text-white">
              {email ? (
                <>You can now sign in with <strong>{email}</strong>.</>
              ) : (
                <>You can now sign in with your email and password.</>
              )}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
            >
              Go to Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
