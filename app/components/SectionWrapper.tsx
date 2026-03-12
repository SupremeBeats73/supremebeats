import { ReactNode } from "react";

interface SectionWrapperProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionWrapper({
  id,
  children,
  className = "",
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`py-[var(--section-padding)] px-4 sm:px-6 ${className}`}
    >
      <div className="mx-auto max-w-[var(--container-max)]">{children}</div>
    </section>
  );
}
