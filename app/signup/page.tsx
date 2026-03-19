"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import AuthLayout from "../components/AuthLayout";
import { formatAuthError } from "../lib/authErrors";
import { normalizeUsername } from "../lib/usernameUtils";

type OAuthProvider = "google" | "facebook";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSignupSuccess(false);
    setLoading(true);
    const normalizedUsername = username ? normalizeUsername(username) : "";
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: normalizedUsername || undefined,
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(formatAuthError(err.message));
      return;
    }
    // If no session, email confirmation is required — do not redirect; user is not fully logged in
    if (!data.session) {
      setSignupSuccess(true);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setOauthLoading(provider);
    const rawBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined" ? window.location.origin : "");

    // Vercel env vars occasionally come through with quotes/whitespace; Supabase expects a valid absolute URL.
    const baseUrl = String(rawBaseUrl)
      .trim()
      .replace(/^["']/, "")
      .replace(/["']$/, "");

    const redirectTo = new URL("/auth/callback", baseUrl).toString();
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (err) {
      setError(formatAuthError(err.message));
      setOauthLoading(null);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    setError("Sign-up could not start. Please try again.");
    setOauthLoading(null);
  }

  if (signupSuccess) {
    return (
      <AuthLayout title="Sign up" subtitle="Create your account. Start creating.">
        <div className="rounded-xl border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-[var(--neon-green)]">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-white">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to confirm your account and then log in.
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            If you don&apos;t see it, check your spam folder.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Go to Log in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign up"
      subtitle="Create your account. Start creating."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2">
            <p className="text-sm font-medium text-red-300">Sign up failed</p>
            <p className="mt-0.5 text-sm text-red-200">{error}</p>
          </div>
        )}
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-[var(--muted)]"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
            placeholder="my_username"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Shown on your profile and across the site. You can change it only once in account settings.
          </p>
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-[var(--muted)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-[var(--muted)]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-12 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] rounded-xl bg-[var(--neon-green)] py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)] disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--background)] px-3 text-[var(--muted)]">
              Or sign up with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {oauthLoading === "google" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="hidden sm:inline">Google</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("facebook")}
            disabled={!!oauthLoading}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {oauthLoading === "facebook" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="hidden sm:inline">Facebook</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-[var(--neon-green)] hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[var(--neon-green)] hover:underline">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
