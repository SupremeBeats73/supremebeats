import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sessionId =
    typeof params?.session_id === "string" ? params.session_id : null;

  // If Stripe sent us here with a session_id, verify and apply the upgrade
  if (sessionId) {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    try {
      await fetch(`${base}/api/checkout/success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (e) {
      console.error("[success] verify payment", e);
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("credits, mic_tier")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Payment Successful!
        </h1>

        {user ? (
          <>
            <div className="my-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-sm font-black uppercase tracking-widest text-green-500">
                Current Balance
              </p>
              <p className="text-4xl font-black text-white">
                {profile?.credits ?? 0}{" "}
                <span className="text-lg font-normal text-gray-400">Coins</span>
              </p>
              {(profile?.mic_tier === "gold" || profile?.mic_tier === "elite") && (
                <p className="mt-2 text-xs font-bold italic uppercase text-yellow-500">
                  ✨ Elite Gold Status Active
                </p>
              )}
            </div>

            <Link
              href="/dashboard"
              className="block w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:bg-gray-200"
            >
              Return to Studio
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-400">
              Sign in to see your balance and continue.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:bg-gray-200"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="mt-3 block w-full rounded-2xl border border-white/10 py-4 font-bold text-white transition hover:bg-white/5"
            >
              Return to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
