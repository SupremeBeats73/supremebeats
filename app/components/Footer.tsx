import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/40">
      <div className="mx-auto max-w-[var(--container-max)] px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <span className="text-sm font-semibold text-white">
            SupremeBeats
          </span>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/#features" className="transition-colors hover:text-white">
              Features
            </Link>
            <Link href="/about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Log In
            </Link>
            <Link href="/signup" className="transition-colors hover:text-white">
              Sign Up
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-[var(--muted)]">
          The AI-powered music creator network. Create. Compete. Rise.
        </p>
      </div>
    </footer>
  );
}
