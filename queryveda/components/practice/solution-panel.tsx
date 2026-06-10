"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SolutionPanelProps {
  solution: string;
  tips: string;
  optSolution?: string;
}

export function SolutionPanel({
  solution,
  tips,
  optSolution,
}: SolutionPanelProps) {
  const [showMain, setShowMain] = useState(false);
  const [showOpt, setShowOpt] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Main solution */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMain((s) => !s)}
      >
        {showMain ? "Hide Solution & Tips" : "Show Solution & Tips"}
      </Button>
      {showMain && (
        <div className="rounded-md border-l-4 border-purple-500 bg-purple-500/10 p-4 flex flex-col gap-2">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
            {solution}
          </pre>
          <p className="text-sm text-muted-foreground">{tips}</p>
        </div>
      )}

      {/* Optimized solution */}
      {optSolution && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOpt((s) => !s)}
          >
            {showOpt
              ? "Hide Optimized Solution & Tips"
              : "Show Optimized Solution & Tips"}
          </Button>
          {showOpt && (
            <div className="rounded-md border-l-4 border-purple-500 bg-purple-500/10 p-4">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                {optSolution}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
