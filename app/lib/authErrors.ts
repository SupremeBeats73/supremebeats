/**
 * Map Supabase auth error messages to clear, user-friendly copy.
 */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email using the link we sent you, then try again.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "An account with this email already exists. Try logging in or use a different email.";
  }
  if (lower.includes("password") && lower.includes("weak")) {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (lower.includes("signup") && lower.includes("disabled")) {
    return "Sign up is currently disabled. Please contact support.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}
