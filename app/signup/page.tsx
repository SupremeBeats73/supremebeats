"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import AuthLayout from "../components/AuthLayout";
import { formatAuthError } from "../lib/authErrors";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSignupSuccess(false);
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || undefined,
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
            Username (optional)
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
            placeholder="creator"
          />
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
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--neon-green)] py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)] disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </AuthLayout>
  );
}
