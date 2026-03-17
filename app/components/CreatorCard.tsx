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
    <div className="glass-panel glass-panel--status rounded-xl p-4 transition-all duration-300 hover:shadow-[var(--glass-shadow-status)]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--deep-purple)] text-lg font-bold text-[var(--purple-glow)]">
        {name.slice(0, 1)}
      </div>
      <h4 className="mb-2 font-semibold text-white">{name}</h4>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span>{plays} plays</span>
        <span>★ {rating}</span>
        <span
          className="rounded bg-[var(--purple-mid)]/60 px-1.5 py-0.5 text-[var(--purple-glow)]"
          title="Mic tier badge"
        >
          {micTier}
        </span>
        <span>{engagement} engagement</span>
      </div>
    </div>
  );
}
