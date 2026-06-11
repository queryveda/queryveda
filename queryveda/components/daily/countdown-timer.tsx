"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  label: string;
  getRemaining: () => number; // returns ms remaining
  onExpire?: () => void;
  className?: string;
}

function splitTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

function Digit({ value }: { value: string }) {
  return (
    <span className="inline-flex h-9 w-7 items-center justify-center rounded-md bg-foreground/10 text-lg font-mono font-bold tabular-nums">
      {value}
    </span>
  );
}

function DigitPair({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex gap-0.5">
        <Digit value={value[0]} />
        <Digit value={value[1]} />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <span className="self-start mt-2 text-lg font-bold text-muted-foreground/60">:</span>
  );
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

  const { h, m, s } = splitTime(remaining);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <DigitPair value={h} label="hrs" />
        <Separator />
        <DigitPair value={m} label="min" />
        <Separator />
        <DigitPair value={s} label="sec" />
      </div>
    </div>
  );
}
