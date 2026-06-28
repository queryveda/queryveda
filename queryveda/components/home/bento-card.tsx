import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
}

export function BentoCard({ children, className = "" }: BentoCardProps) {
  return (
    <div
      className={`rounded-2xl p-[1px] transition-all duration-150 hover:shadow-md hover:-translate-y-[1px] ${className}`}
      style={{ background: "var(--qv-gradient-card)" }}
    >
      <div className="rounded-2xl bg-card p-5 h-full">
        {children}
      </div>
    </div>
  );
}
