"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "glass-panel border-white/5"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
        >
          SupremeBeats
        </Link>
        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex sm:gap-6">
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

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-white sm:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="glass-panel fixed right-0 top-0 z-50 h-full w-72 max-w-[90vw] border-l border-white/10 p-4"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-2">
              <Link
                href="/#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-white hover:bg-white/5"
              >
                Features
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-white hover:bg-white/5"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-[var(--neon-green)] px-3 py-3 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
              >
                Sign Up
              </Link>
            </nav>
          </aside>
        </>
      )}
    </nav>
  );
}
