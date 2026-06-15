"use client";

interface MasteryBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}

export function MasteryBar({ completed, total, showLabel = true }: MasteryBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundImage: pct === 100
              ? "linear-gradient(90deg, #6d28d9, #a855f7, #6d28d9)"
              : "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--primary)))",
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {completed}/{total}
        </span>
      )}
    </div>
  );
}
