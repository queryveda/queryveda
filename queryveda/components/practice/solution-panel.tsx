"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SolutionPanelProps {
  solution: string;
  tips: string;
  optSolution?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-0.5 rounded-md bg-background/50 hover:bg-background border text-muted-foreground hover:text-foreground transition-colors"
      type="button"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
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
        className="rounded-full"
        onClick={() => setShowMain((s) => !s)}
      >
        {showMain ? "Hide Solution & Tips" : "Show Solution & Tips"}
      </Button>
      {showMain && (
        <div className="rounded-xl border-l-4 border-purple-500 bg-purple-500/10 p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono flex-1">
              {solution}
            </pre>
            <CopyButton text={solution} />
          </div>
          <p className="text-sm text-muted-foreground">{tips}</p>
        </div>
      )}

      {/* Optimized solution */}
      {optSolution && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setShowOpt((s) => !s)}
          >
            {showOpt
              ? "Hide Optimized Solution & Tips"
              : "Show Optimized Solution & Tips"}
          </Button>
          {showOpt && (
            <div className="rounded-xl border-l-4 border-purple-500 bg-purple-500/10 p-4">
              <div className="flex items-start justify-between gap-2">
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono flex-1">
                  {optSolution}
                </pre>
                <CopyButton text={optSolution} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
