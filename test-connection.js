/**
 * Supabase connection test. Run: npm run test:connection
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (copy .env.example to .env.local or .env and fill in values).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env or .env.local from project root if present (no extra dependency)
const envFiles = [".env.local", ".env"];
for (const f of envFiles) {
  const p = resolve(process.cwd(), f);
  if (existsSync(p)) {
    const content = readFileSync(p, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    console.log(`Loaded env from ${f}`);
    break;
  }
}

async function testConnection() {
  const { supabase } = await import("./app/lib/supabaseClient");

  console.log("🚀 Testing Supabase connection...");

  // 1. Test Auth Connection
  const { error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error("❌ Auth Error:", authError.message);
  } else {
    console.log("✅ Auth System: Online");
  }

  // 2. Test Database Read (Fetching your projects table)
  const { data: dbData, error: dbError } = await supabase
    .from("projects")
    .select("*")
    .limit(1);

  if (dbError) {
    console.error("❌ Database Error:", dbError.message);
    console.log("Tip: If you see 'PGRST116', it might just mean the table is empty, which is fine!");
  } else {
    console.log("✅ Database Read: Successful");
    console.log("Data sample:", dbData);
  }
}

testConnection();
