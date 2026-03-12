/**
 * Admin access control.
 * Only emails in NEXT_PUBLIC_ADMIN_EMAILS (e.g. in .env.local) can access /admin.
 * Example: NEXT_PUBLIC_ADMIN_EMAILS=admin@supremebeats.com
 * Replace with Supabase role or server-side check in production.
 */
const DEFAULT_ADMIN_EMAILS: string[] = [];

function getAdminEmails(): string[] {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    if (env) return env.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
