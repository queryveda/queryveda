"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyStatus } from "@/hooks/use-daily-status";

export function DailyToast() {
  const { hasUnattempted } = useDailyStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasUnattempted) return;

    const shown = sessionStorage.getItem("qv_daily_toast_shown");
    if (shown) return;

    setVisible(true);
    sessionStorage.setItem("qv_daily_toast_shown", "1");

    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [hasUnattempted]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border bg-card p-4 shadow-lg flex items-center gap-3 max-w-sm">
        <div className="flex-1">
          <p className="text-sm font-medium">Today&apos;s Daily Challenge is live!</p>
        </div>
        <Link href="/daily">
          <Button size="sm" className="shrink-0">Try Now</Button>
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
