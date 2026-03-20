"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/jobs-credits", label: "Jobs & Credits" },
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tracks", label: "Tracks" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/discovery", label: "Discovery" },
  { href: "/admin/monetization", label: "Monetization" },
  { href: "/admin/trust-abuse", label: "Trust & Abuse" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Avoid synchronous setState during effect render; defer to the next tick.
    const id = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[var(--background)]/80 backdrop-blur sm:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-white/5 hover:text-white"
              aria-label="Open admin menu"
              aria-expanded={menuOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold text-red-400">Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-white">
            Back
          </Link>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 border-r border-white/5 bg-[var(--card-bg)]/95 backdrop-blur-xl sm:block">
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center gap-2 border-b border-red-500/30 pb-3">
            <span className="text-sm font-bold text-red-400">Admin</span>
            <span className="text-xs text-[var(--muted)]">Control</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {ADMIN_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-red-500/20 text-red-300"
                      : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/dashboard"
            className="mt-4 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white"
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm sm:hidden"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] border-r border-white/10 bg-[var(--card-bg)]/95 p-4 backdrop-blur-xl sm:hidden"
            role="dialog"
            aria-label="Admin navigation"
          >
            <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-400">Admin</span>
                <span className="text-xs text-[var(--muted)]">Control</span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-white/10 hover:text-white"
                aria-label="Close admin menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-1">
              {ADMIN_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-lg px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-red-500/20 text-red-300"
                        : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="mt-4 block rounded-lg px-3 py-3 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white"
            >
              ← Back to app
            </Link>
          </aside>
        </>
      )}

      <main className="min-h-screen sm:pl-56">
        <div className="border-b border-white/5 bg-[var(--background)]/80 px-4 py-4 sm:px-6">
          <p className="text-xs text-[var(--muted)]">Private admin area. Actions are logged.</p>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
