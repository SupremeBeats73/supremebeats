/**
 * Supabase connection + schema checks for landing/discovery.
 * Run: npm run test:connection
 *
 * Uses the anon key (same as the browser). Requires NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local or .env.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

function hintForDbError(msg, table) {
  const m = msg || "";
  if (/relation .+ does not exist|Could not find the table/i.test(m)) {
    return `Apply repo migrations (see supabase/migrations). For ${table}, run the SQL in 20250328000000_tracks.sql or 20250328000001_profiles_add_discovery_columns.sql in the Supabase SQL Editor.`;
  }
  if (/permission denied|RLS|row-level security/i.test(m)) {
    return `Check RLS policies for ${table}. Tracks need "Tracks are readable by everyone"; profiles need "Profiles are readable by everyone" (see those migration files).`;
  }
  if (/column .+ does not exist/i.test(m)) {
    return `Run 20250328000001_profiles_add_discovery_columns.sql so landing-page columns exist on public.profiles.`;
  }
  return null;
}

async function main() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    console.error(
      "Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local — see .env.example."
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log("Testing Supabase (anon client, Node)...");

  const { error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error("Auth check failed:", authError.message);
  } else {
    console.log("Auth reachable: OK");
  }

  const { error: projectsError } = await supabase.from("projects").select("id").limit(1);
  if (projectsError) {
    console.error("projects read failed:", projectsError.message);
    const h = hintForDbError(projectsError.message, "projects");
    if (h) console.error("Hint:", h);
  } else {
    console.log("projects table: OK (readable with anon or empty)");
  }

  const tracksSelect =
    "id,title,creator_name,plays,rating,mic_badge,engagement";
  const { data: trackRows, error: tracksError } = await supabase
    .from("tracks")
    .select(tracksSelect)
    .limit(1);

  if (tracksError) {
    console.error("tracks (landing query) failed:", tracksError.message);
    const h = hintForDbError(tracksError.message, "tracks");
    if (h) console.error("Hint:", h);
  } else {
    console.log(
      `tracks (landing query): OK (${trackRows?.length ?? 0} row(s) in sample; empty table is fine)`
    );
  }

  const profilesSelect = "id,display_name,plays,rating,mic_tier,engagement";
  const { data: profileRows, error: profilesError } = await supabase
    .from("profiles")
    .select(profilesSelect)
    .limit(1);

  if (profilesError) {
    console.error("profiles (landing query) failed:", profilesError.message);
    const h = hintForDbError(profilesError.message, "profiles");
    if (h) console.error("Hint:", h);
  } else {
    console.log(
      `profiles (landing query): OK (${profileRows?.length ?? 0} row(s) in sample; empty table is fine)`
    );
  }

  const failed = !!(tracksError || profilesError);
  if (failed) {
    console.error("\nFix the errors above, then re-run: npm run test:connection");
    process.exit(1);
  }

  console.log("\nLanding / discovery schema: all checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
