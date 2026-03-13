import { createClient } from "@supabase/supabase-js";

// Try to load env variables, otherwise use your specific project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpdsusbghxytanfmjofb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZHN1c2JnaHh5dGFuZm1qb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzgwNDIsImV4cCI6MjA4ODUxNDA0Mn0.V_tkqwwAAabQlvIW4HN0xLWY2TgTq6i5kMvsS6MWNTw';

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn("⚠️ Supabase URL is missing or using placeholder.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
