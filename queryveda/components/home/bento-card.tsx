import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** Gradient border color — defaults to the standard purple card gradient */
  gradient?: string;
  /** Optional glow color for hover effect */
  glow?: string;
}

export function BentoCard({
  children,
  className = "",
  gradient,
  glow,
}: BentoCardProps) {
  return (
    <div
      className={`noise-bg relative rounded-2xl p-[1px] transition-all duration-200 hover:shadow-lg hover:-translate-y-[2px] group ${className}`}
      style={{
        background: gradient ?? "var(--qv-gradient-card)",
        ...(glow ? { "--card-glow": glow } as React.CSSProperties : {}),
      }}
    >
      <div className="rounded-2xl bg-card p-5 h-full transition-shadow duration-200 group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {children}
      </div>
    </div>
  );
}
