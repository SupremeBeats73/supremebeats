/**
 * Username rules: no spaces (use underscore instead). Special characters allowed.
 */

const MAX_USERNAME_LENGTH = 50;

/**
 * Normalizes a username: trims and replaces spaces with underscores.
 * Special characters like $*!~ are left as-is.
 */
export function normalizeUsername(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, MAX_USERNAME_LENGTH);
}

/**
 * Validates username for display/API: not empty after normalize.
 */
export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value);
  return normalized.length > 0;
}
