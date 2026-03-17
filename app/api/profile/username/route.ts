import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { normalizeUsername, isValidUsername } from "@/app/lib/usernameUtils";

/**
 * GET: Return the current user's display name (username) from profiles.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, display_name_changes_remaining")
    .eq("id", user.id)
    .maybeSingle();
  const changesRemaining =
    typeof profile?.display_name_changes_remaining === "number"
      ? profile.display_name_changes_remaining
      : 1;
  return NextResponse.json({
    username: profile?.display_name ?? null,
    display_name_changes_remaining: changesRemaining,
  });
}

/**
 * PATCH: Update the current user's display_name (username).
 * Body: { username: string }. Spaces are replaced with underscores.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const raw = typeof body.username === "string" ? body.username : "";
  const username = normalizeUsername(raw);
  if (!isValidUsername(raw)) {
    return NextResponse.json(
      { error: "Username cannot be empty." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name_changes_remaining")
    .eq("id", user.id)
    .maybeSingle();
  const changesRemaining =
    typeof profile?.display_name_changes_remaining === "number"
      ? profile.display_name_changes_remaining
      : 1;
  if (changesRemaining < 1) {
    return NextResponse.json(
      { error: "You have already used your one username change." },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: username,
      display_name_changes_remaining: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }
    console.error("[profile/username] update", error);
    return NextResponse.json(
      { error: "Could not update username." },
      { status: 500 }
    );
  }
  return NextResponse.json({ username });
}
