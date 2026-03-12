interface CreatorCardProps {
  name: string;
  plays: string | number;
  rating: number;
  micTier: string;
  engagement?: string;
}

export default function CreatorCard({
  name,
  plays,
  rating,
  micTier,
  engagement = "—",
}: CreatorCardProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--purple-glow)]/25 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--deep-purple)] text-lg font-bold text-[var(--neon-green)]">
        {name.slice(0, 1)}
      </div>
      <h4 className="mb-2 font-semibold text-white">{name}</h4>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span>{plays} plays</span>
        <span>★ {rating}</span>
        <span
          className="rounded bg-[var(--purple-mid)]/60 px-1.5 py-0.5 text-[var(--neon-green)]"
          title="Mic tier badge"
        >
          {micTier}
        </span>
        <span>{engagement} engagement</span>
      </div>
    </div>
  );
}
