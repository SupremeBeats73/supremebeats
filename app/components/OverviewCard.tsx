interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
}

export default function OverviewCard({
  title,
  value,
  subtitle,
  accent,
}: OverviewCardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[var(--purple-glow)]/25 ${
        accent ? "border-[var(--neon-green)]/20" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {title}
      </p>
      <p
        className={`mt-2 text-2xl font-bold text-white ${
          accent ? "text-[var(--neon-green)]" : ""
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
      )}
    </div>
  );
}
