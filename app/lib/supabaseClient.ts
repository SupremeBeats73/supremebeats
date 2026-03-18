import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Supabase URL or anon key is not set. Browser Supabase client will not work until configured."
  );
}

type TypedSupabaseClient = SupabaseClient;

export const supabase: TypedSupabaseClient =
  typeof window !== "undefined" && supabaseUrl && supabaseKey
    ? createBrowserClient(supabaseUrl, supabaseKey)
    : createClient(
        supabaseUrl || "",
        supabaseKey || ""
      );

