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
      className={`glass-panel rounded-xl p-5 transition-all duration-300 hover:border-[var(--glass-border-status)] ${
        accent ? "glass-panel--status" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {title}
      </p>
      <p
        className={`mt-2 text-2xl font-bold text-white ${
          accent ? "text-[var(--purple-glow)]" : ""
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
