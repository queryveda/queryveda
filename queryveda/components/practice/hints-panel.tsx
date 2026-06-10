"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HintsPanelProps {
  hints: string[];
}

export function HintsPanel({ hints }: HintsPanelProps) {
  const [revealed, setRevealed] = useState(0);

  const allRevealed = revealed >= hints.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={allRevealed}
          onClick={() => setRevealed((r) => r + 1)}
        >
          Get a Hint
        </Button>
        <span className="text-xs text-muted-foreground">
          {revealed}/{hints.length}
        </span>
      </div>
      {hints.slice(0, revealed).map((hint, i) => (
        <div key={i} className="rounded-xl bg-muted p-3 text-sm">
          <span className="font-medium">Hint {i + 1}:</span> {hint}
        </div>
      ))}
    </div>
  );
}
