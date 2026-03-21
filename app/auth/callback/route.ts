import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Use the origin the user actually requested (e.g. www vs apex).
 * PKCE cookies are host-specific; redirecting to a different origin after exchange
 * breaks session/cookie alignment. NEXT_PUBLIC_SITE_URL is still used elsewhere for emails/links.
 */
function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${proto}://${forwardedHost.split(",")[0].trim()}`;
  }
  return new URL(request.url).origin;
}

/**
 * OAuth (e.g. Google) redirect target: exchange ?code= for a session using the
 * incoming request cookies (PKCE verifier chunks). Sets session cookies on the response.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextRaw = requestUrl.searchParams.get("next");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  const siteOrigin = getRequestOrigin(request);
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";

  if (errorParam) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "callback");
    if (errorDescription) {
      login.searchParams.set(
        "message",
        errorDescription.length > 500 ? errorDescription.slice(0, 500) : errorDescription
      );
    }
    return NextResponse.redirect(login);
  }

  if (!code) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "callback");
    return NextResponse.redirect(login);
  }

  const redirectUrl = new URL(nextPath, siteOrigin);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const login = new URL("/login", siteOrigin);
    login.searchParams.set("error", "callback");
    if (exchangeError.message) {
      login.searchParams.set(
        "message",
        exchangeError.message.length > 500
          ? exchangeError.message.slice(0, 500)
          : exchangeError.message
      );
    }
    return NextResponse.redirect(login);
  }

  return response;
}
