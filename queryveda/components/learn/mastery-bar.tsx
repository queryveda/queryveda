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
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
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
