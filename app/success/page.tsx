import Link from "next/link";

export default async function SuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <svg
            className="h-10 w-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">
          Payment Successful!
        </h1>
        <p className="mb-8 text-gray-400">
          Your account has been updated. Your new credits or status should be
          visible in your dashboard now.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/studio"
            className="block w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:bg-gray-200"
          >
            Go to My Studio
          </Link>
          <Link
            href="/"
            className="block w-full rounded-2xl border border-white/10 bg-transparent py-4 font-bold text-white transition hover:bg-white/5"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
