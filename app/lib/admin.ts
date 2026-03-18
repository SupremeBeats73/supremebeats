/**
 * Elite user check: Gold Mic + infinite credits in UI.
 * True if userTier === 'Elite' or userEmail is in NEXT_PUBLIC_ADMIN_EMAILS.
 */

function getAdminEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!env || typeof env !== "string") return [];
  return env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if the user should be treated as Elite (Gold Mic, infinite credits).
 * - true when userTier === 'Elite' (case-insensitive)
 * - true when userEmail is in NEXT_PUBLIC_ADMIN_EMAILS (comma-separated list)
 */
export function isEliteUser(
  userEmail: string | null | undefined,
  userTier: string | null | undefined,
  isAdmin?: boolean | null
): boolean {
  if (isAdmin === true) return true;
  if (userTier != null && String(userTier).trim().toLowerCase() === "elite") {
    return true;
  }
  if (userTier != null && String(userTier).trim().toLowerCase() === "gold") {
    return true;
  }
  if (!userEmail || typeof userEmail !== "string") return false;
  const email = userEmail.trim().toLowerCase();
  return getAdminEmails().includes(email);
}
