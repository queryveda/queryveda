"use client";

import { useState } from "react";

export function TimeUpBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400 animate-in fade-in slide-in-from-top-2 duration-300">
      <span>Time&apos;s up! You can still keep working on the challenge.</span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md px-2 py-0.5 text-xs hover:bg-amber-500/20 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
