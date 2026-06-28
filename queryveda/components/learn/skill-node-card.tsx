"use client";

import Link from "next/link";
import { Lock, Star, CheckCircle2, ChevronRight } from "lucide-react";
import { MasteryBar } from "./mastery-bar";
import type { NodeMastery, SkillNode } from "@/lib/skill-tree-types";

interface SkillNodeCardProps {
  node: SkillNode;
  mastery: NodeMastery;
  onNodeClick?: (node: SkillNode) => void;
}

export function SkillNodeCard({ node, mastery, onNodeClick }: SkillNodeCardProps) {
  const { unlocked, starred, completed, total, percentage } = mastery;

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center gap-3 w-[160px]">
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
          <Lock className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <span className="text-sm text-muted-foreground/50 text-center font-medium">
          {node.title}
        </span>
      </div>
    );
  }

  // Determine visual state
  const isComplete = percentage === 100;
  const inProgress = percentage > 0 && percentage < 100;
  const notStarted = percentage === 0;

  const nodeVisual = (
    <div className="flex flex-col items-center gap-3 w-[160px] group">
      {/* Node circle with gradient and glow */}
      <div className="relative">
        {/* Glow ring for starred/complete */}
        {(starred || isComplete) && (
          <div
            className={`absolute -inset-1 rounded-2xl blur-md opacity-40 ${
              starred ? "bg-yellow-500" : "bg-primary"
            }`}
          />
        )}
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5 ${
            starred
              ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
              : isComplete
              ? "bg-gradient-to-br from-primary/20 to-violet-500/10 border-2 border-primary/50 shadow-lg shadow-primary/20"
              : inProgress
              ? "bg-gradient-to-br from-primary/15 to-violet-500/5 border-2 border-primary/30 shadow-md shadow-primary/10"
              : "bg-gradient-to-br from-muted/60 to-muted/30 border-2 border-border group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/10"
          }`}
        >
          {starred ? (
            <Star className="w-7 h-7 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          ) : isComplete ? (
            <CheckCircle2 className="w-7 h-7 text-primary drop-shadow-sm" />
          ) : inProgress ? (
            <span className="text-base font-bold text-primary">{percentage}%</span>
          ) : (
            <ChevronRight className="w-6 h-6 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>

      {/* Title */}
      <span
        className={`text-sm font-semibold text-center leading-tight transition-colors ${
          starred
            ? "text-yellow-500"
            : isComplete
            ? "text-primary"
            : "text-foreground/80 group-hover:text-primary"
        }`}
      >
        {node.title}
      </span>

      {/* Progress bar */}
      {inProgress && (
        <div className="w-28">
          <MasteryBar completed={completed} total={total} showLabel={false} />
        </div>
      )}

      {/* Status label */}
      {notStarted && (
        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider group-hover:text-primary/60 transition-colors">
          Start
        </span>
      )}
    </div>
  );

  if (onNodeClick) {
    return (
      <button
        onClick={() => onNodeClick(node)}
        className="bg-transparent border-none p-0 cursor-pointer"
      >
        {nodeVisual}
      </button>
    );
  }

  return (
    <Link href={`/learn/${node.id}`}>
      {nodeVisual}
    </Link>
  );
}
