"use client";

import Link from "next/link";
import { Lock, Star, CheckCircle2 } from "lucide-react";
import { MasteryBar } from "./mastery-bar";
import type { NodeMastery, SkillNode } from "@/lib/skill-tree-types";

interface SkillNodeCardProps {
  node: SkillNode;
  mastery: NodeMastery;
}

export function SkillNodeCard({ node, mastery }: SkillNodeCardProps) {
  const { unlocked, starred, completed, total, percentage } = mastery;

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/40">
          <Lock className="w-5 h-5 text-muted-foreground/70" />
        </div>
        <span className="text-sm text-muted-foreground/80 text-center max-w-[140px]">
          {node.title}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/learn/${node.id}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
          starred
            ? "border-yellow-500 bg-yellow-500/10"
            : percentage > 0
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/40 bg-background"
        }`}
      >
        {starred ? (
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        ) : percentage === 100 ? (
          <CheckCircle2 className="w-6 h-6 text-primary" />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {percentage > 0 ? `${percentage}%` : "Start"}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-center max-w-[140px] group-hover:text-primary transition-colors">
        {node.title}
      </span>
      {percentage > 0 && percentage < 100 && (
        <div className="w-24">
          <MasteryBar completed={completed} total={total} showLabel={false} />
        </div>
      )}
    </Link>
  );
}
