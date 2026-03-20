import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";

/**
 * Facebook/Meta Data Deletion Callback (required for Facebook Login).
 * Meta POSTs here when a user removes the app and requests data deletion.
 * Register this URL in Meta App Dashboard → App Settings → Basic → Data Deletion Request URL.
 *
 * Request: POST with form body signed_request (dot-separated signature.payload, base64url).
 * Response: JSON { url: string, confirmation_code: string }
 */

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or SERVICE_ROLE_KEY is not set");
  return createClient(url, key);
}

function base64UrlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

function parseSignedRequest(signedRequest: string, appSecret: string): { user_id: string } | null {
  const parts = signedRequest.split(".", 2);
  if (parts.length !== 2) return null;
  const [encodedSig, payload] = parts;
  const sig = base64UrlDecode(encodedSig);
  const expectedSig = createHmac("sha256", appSecret).update(payload).digest();
  if (sig.length !== expectedSig.length || !sig.equals(expectedSig)) return null;
  try {
    const data = JSON.parse(base64UrlDecode(payload).toString("utf8"));
    return typeof data?.user_id === "string" ? data : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const appSecret = process.env.FACEBOOK_APP_SECRET ?? process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[facebook-data-deletion] FACEBOOK_APP_SECRET / META_APP_SECRET not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const params = new URLSearchParams(body);
  const signedRequest = params.get("signed_request");
  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const parsed = parseSignedRequest(signedRequest, appSecret);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const facebookUserId = parsed.user_id;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const confirmationCode = `sb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const statusUrl = `${siteUrl.replace(/\/$/, "")}/privacy#data-deletion`;

  try {
    const supabase = getSupabaseAdmin();
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const users = usersData?.users ?? [];
    let foundUserId: string | null = null;
    for (const user of users) {
      const identities = (user as { identities?: Array<{ provider?: string; id?: string; provider_id?: string }> }).identities ?? [];
      const fbId = (i: { provider?: string; id?: string; provider_id?: string }) =>
        (i.provider === "facebook" || i.provider === "meta") &&
        (i.id === facebookUserId || i.provider_id === facebookUserId);
      const fbIdentity = identities.find(fbId);
      if (fbIdentity) {
        foundUserId = user.id;
        break;
      }
    }

    if (foundUserId) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(foundUserId);
      if (deleteError) {
        console.error("[facebook-data-deletion] deleteUser failed", foundUserId, deleteError);
      }
    }
  } catch (e) {
    console.error("[facebook-data-deletion] Error processing deletion", e);
  }

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
}
