/**
 * Absolute URL for Supabase OAuth `redirectTo` (e.g. /auth/callback).
 *
 * Must use the **same host** as the tab that calls `signInWithOAuth`, so PKCE
 * verifier cookies set via @supabase/ssr are sent back after Google redirects.
 * If `NEXT_PUBLIC_SITE_URL` is apex but the user is on www (or localhost vs prod),
 * using the env URL alone breaks PKCE ("code verifier not found").
 */
export function getOAuthCallbackRedirectUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL("/auth/callback", window.location.origin).href;
  }
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (/^https?:\/\//i.test(raw)) {
    return new URL("/auth/callback", raw).href;
  }
  return new URL("/auth/callback", "http://localhost:3000").href;
}
