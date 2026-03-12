"use client";

import { useEffect } from "react";
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
  { href: "/dashboard/billing", label: "Billing" },
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

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "var(--background)",
        }}
      >
        <p className="text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (!user && !loading) return null;
  if (!user) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-white/5 bg-[var(--card-bg)]/80 backdrop-blur-xl">
        <div className="flex h-full flex-col p-4">
          <Link
            href="/dashboard"
            className="mb-6 text-lg font-bold text-white hover:opacity-90"
          >
            SupremeBeats
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--purple-mid)]/40 text-[var(--neon-green)]"
                      : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => signOut().then(() => router.push("/"))}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <header className="fixed left-56 right-0 top-0 z-30 border-b border-white/5 bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-6">
          <span className="text-sm text-[var(--muted)]">
            {user?.email}
          </span>
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </header>
      <main className="pl-56 pt-14 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
