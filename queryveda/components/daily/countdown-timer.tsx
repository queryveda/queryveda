"use client";

import { useEffect, useState } from "react";
import { formatMs } from "@/lib/daily";

interface CountdownTimerProps {
  label: string;
  getRemaining: () => number; // returns ms remaining
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ label, getRemaining, onExpire, className = "" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [getRemaining, onExpire]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-mono font-bold tabular-nums">{formatMs(remaining)}</span>
    </div>
  );
}
