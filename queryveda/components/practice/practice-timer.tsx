"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

interface PracticeTimerProps {
  active: boolean;
  onStart: () => void;
  onStop: () => void;
  onExpire: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PracticeTimer({ active, onStart, onStop, onExpire }: PracticeTimerProps) {
  const [duration, setDuration] = useState(15);
  const [remaining, setRemaining] = useState(0);
  const expiredRef = useRef(false);

  const handleStart = () => {
    setRemaining(duration * 60);
    expiredRef.current = false;
    onStart();
  };

  const handleStop = useCallback(() => {
    setRemaining(0);
    onStop();
  }, [onStop]);

  useEffect(() => {
    if (!active || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, remaining, onExpire]);

  if (!active) {
    return (
      <div className="flex items-center gap-1.5">
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="rounded-lg border bg-background px-2 py-1 text-xs h-8"
        >
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} min
            </option>
          ))}
        </select>
        <Button
          onClick={handleStart}
          size="sm"
          variant="outline"
          className="rounded-full h-8 text-xs"
        >
          <span className="hidden sm:inline">Start Timer</span>
          <span className="sm:hidden">Timer</span>
        </Button>
      </div>
    );
  }

  const isUrgent = remaining > 0 && remaining <= 60;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          remaining === 0
            ? "text-red-500"
            : isUrgent
            ? "text-red-500 animate-pulse"
            : "text-foreground"
        }`}
      >
        {remaining > 0 ? formatTime(remaining) : "00:00"}
      </span>
      <Button
        onClick={handleStop}
        size="sm"
        variant="ghost"
        className="rounded-full h-7 text-xs px-2"
      >
        Stop
      </Button>
    </div>
  );
}
