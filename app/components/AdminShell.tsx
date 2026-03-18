"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-white/5 bg-[var(--card-bg)]/95 backdrop-blur-xl">
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center gap-2 border-b border-red-500/30 pb-3">
            <span className="text-sm font-bold text-red-400">Admin</span>
            <span className="text-xs text-[var(--muted)]">Control</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {ADMIN_NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
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
      <main className="pl-56 min-h-screen">
        <div className="border-b border-white/5 bg-[var(--background)]/80 px-6 py-4">
          <p className="text-xs text-[var(--muted)]">Private admin area. Actions are logged.</p>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
