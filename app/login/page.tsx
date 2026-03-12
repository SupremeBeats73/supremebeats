"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import AuthLayout from "../components/AuthLayout";
import { formatAuthError } from "../lib/authErrors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(formatAuthError(err.message));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Enter SupremeBeats."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2">
            <p className="text-sm font-medium text-red-300">Log in failed</p>
            <p className="mt-0.5 text-sm text-red-200">{error}</p>
          </div>
        )}
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--neon-green)] py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
