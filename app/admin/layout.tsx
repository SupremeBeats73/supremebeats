"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { isAdminEmail } from "../lib/adminConfig";
import AdminShell from "../components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAdmin = user ? isAdminEmail(user.email ?? undefined) : false;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
