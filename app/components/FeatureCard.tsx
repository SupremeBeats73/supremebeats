import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export default function FeatureCard({
  title,
  description,
  icon,
}: FeatureCardProps) {
  return (
    <div
      className="group rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm transition-all duration-300 hover:border-[var(--purple-glow)]/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
    >
      {icon && (
        <div className="mb-4 text-[var(--neon-green)] opacity-90 group-hover:opacity-100">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}
