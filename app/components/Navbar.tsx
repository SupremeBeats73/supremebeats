"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
        >
          SupremeBeats
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/#features"
            className="text-sm text-[var(--muted)] transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="/login"
            className="text-sm text-[var(--muted)] transition-colors hover:text-white"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_20px_var(--neon-glow)]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
