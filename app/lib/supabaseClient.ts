import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Supabase URL or anon key is not set. Browser Supabase client will not work until configured."
  );
}

/**
 * Browser-only Supabase client: PKCE and session use cookies (document.cookie), not localStorage.
 * Never import this into Server Components — use `@/utils/supabase/server` instead.
 */
function getBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "Browser Supabase client was used on the server. Use createClient() from @/utils/supabase/server in Server Components, Route Handlers, and Server Actions."
    );
  }
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
}

type TypedSupabaseClient = SupabaseClient;

/**
 * Lazy proxy so the module can load on the server without calling `createBrowserClient`
 * (which requires a browser or explicit cookie adapters).
 */
export const supabase: TypedSupabaseClient = new Proxy({} as TypedSupabaseClient, {
  get(_target, prop) {
    const client = getBrowserClient();
    const value = Reflect.get(client as object, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
