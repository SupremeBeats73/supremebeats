"use client";

import Link from "next/link";

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function CTAButton({
  href,
  children,
  variant = "primary",
  className = "",
}: CTAButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 ";
  const primary =
    "bg-[var(--neon-green)] text-black hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]";
  const secondary =
    "border border-white/20 bg-white/5 text-white hover:border-[var(--neon-green)]/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]";

  return (
    <Link
      href={href}
      className={`${base} ${variant === "primary" ? primary : secondary} ${className}`}
    >
      {children}
    </Link>
  );
}
