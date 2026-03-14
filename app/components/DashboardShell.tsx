"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/studio", label: "Studio" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/feed", label: "Feed" },
  { href: "/dashboard/collabs", label: "Collabs" },
  { href: "/dashboard/revenue", label: "Revenue" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/shop", label: "Supreme Shop", icon: "🛒" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <p className="text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (!user && !loading) return null;
  if (!user) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* Full-width header with hamburger */}
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/5 bg-[var(--background)]/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link
              href="/dashboard"
              className="text-lg font-bold text-white hover:opacity-90"
            >
              SupremeBeats
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[var(--muted)] sm:inline">
              {user?.email}
            </span>
            <Link
              href="/"
              className="text-sm text-[var(--muted)] hover:text-white"
            >
              Back to home
            </Link>
            <button
              onClick={() => signOut().then(() => router.push("/"))}
              className="text-sm text-[var(--muted)] hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown / overlay menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 z-50 h-full w-64 border-r border-white/5 bg-[var(--card-bg)]/95 shadow-xl backdrop-blur-xl"
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex h-full flex-col p-4 pt-16">
              <nav className="flex flex-1 flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-[var(--purple-mid)]/40 text-[var(--neon-green)]"
                          : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {"icon" in item && item.icon && (
                        <span className="text-base" aria-hidden>
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </>
      )}

      {/* Full-width main content */}
      <main className="min-h-screen pt-14">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
