import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Accepts identifier (username) + password.
 * Resolves username to email via profiles.display_name, then signs in with Supabase Auth
 * and returns the session so the client can setSession and stay logged in.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    const identifier = typeof username === "string" ? username.trim() : "";
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return NextResponse.json(
        { error: "Server auth configuration is missing." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Resolve username (display_name) to user id, then get email from auth
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("display_name", identifier)
      .limit(1)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userError || !userData?.user?.email) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const email = userData.user.email;

    // Exchange email + password for session via GoTrue
    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      const msg = tokenData?.error_description ?? tokenData?.msg ?? "Invalid username or password.";
      return NextResponse.json(
        { error: msg },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        expires_at: tokenData.expires_at,
      },
    });
  } catch (e) {
    console.error("[login-by-username]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
