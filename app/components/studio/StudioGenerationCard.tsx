"use client";

type StudioGenerationCardProps = {
  icon: string;
  title: string;
  description: string;
  credits: number;
  comingSoon?: boolean;
  onGenerate?: () => void;
  disabled?: boolean;
  busy?: boolean;
};

const cardBase =
  "group relative flex min-h-[220px] flex-col rounded-2xl border border-[#6E2CF2] bg-black/40 p-6 backdrop-blur-md transition-all duration-300";
const cardShadow =
  "shadow-[0_0_24px_rgba(110,44,242,0.6)] hover:shadow-[0_0_40px_rgba(110,44,242,0.9)]";

export default function StudioGenerationCard({
  icon,
  title,
  description,
  credits,
  comingSoon = false,
  onGenerate,
  disabled = false,
  busy = false,
}: StudioGenerationCardProps) {
  return (
    <div
      className={`${cardBase} ${cardShadow} ${
        comingSoon ? "opacity-60" : ""
      }`}
    >
      <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
        {comingSoon ? (
          <>
            <span className="rounded-full border border-[var(--neon-green)]/40 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-[var(--neon-green)]">
              {credits} credit{credits === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-[var(--neon-green)]/50 bg-[var(--neon-green)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--neon-green)]">
              Coming Soon
            </span>
          </>
        ) : (
          <span className="rounded-full border border-[var(--neon-green)]/40 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-[var(--neon-green)]">
            {credits} credit{credits === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mb-4 text-4xl" aria-hidden>
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
      <p className="mb-6 flex-1 text-sm text-white/60">{description}</p>

      {comingSoon ? (
        <div className="mt-auto rounded-xl border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--neon-green)]">
          Coming Soon
        </div>
      ) : (
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled || busy}
          className="mt-auto min-h-[48px] w-full rounded-xl bg-[var(--neon-green)] py-3 text-sm font-bold uppercase tracking-wide text-black shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_28px_rgba(34,197,94,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : "Generate"}
        </button>
      )}
    </div>
  );
}
