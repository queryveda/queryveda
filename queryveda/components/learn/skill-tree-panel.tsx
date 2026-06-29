"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { skillTreeStorage } from "@/lib/skill-tree-storage";
import { useAuth } from "@/hooks/use-auth";
import type { SkillNode } from "@/lib/skill-tree-types";

interface SkillTreePanelProps {
  node: SkillNode | null;
}

export function SkillTreePanel({ node }: SkillTreePanelProps) {
  const { user } = useAuth();

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
          <ArrowRight className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          Select a topic from the tree
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Click any node to see its exercises
        </p>
      </div>
    );
  }

  const isSolved = (id: string) => !!user && skillTreeStorage.isExerciseCompleted(id);

  const exercises = node.exercises ?? [];
  const completedIds = exercises.filter((ex) => isSolved(ex.id));
  const completedCount = completedIds.length;
  const totalCount = exercises.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const firstUnsolved = exercises.find((ex) => !isSolved(ex.id));
  const continueHref = firstUnsolved
    ? `/learn/${node.id}?exercise=${firstUnsolved.id}`
    : `/learn/${node.id}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold leading-tight">{node.title}</h2>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {node.description}
        </p>
      </div>

      {/* Progress */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Progress
          </span>
          <span className="text-xs font-semibold">
            {completedCount}/{totalCount} completed
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{percentage}% mastered</p>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Exercises
        </p>
        <ul className="space-y-2">
          {exercises.map((ex, idx) => {
            const solved = isSolved(ex.id);
            return (
              <li key={ex.id}>
                <Link
                  href={`/learn/${node.id}?exercise=${ex.id}`}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors group"
                >
                  {solved ? (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-sm leading-snug ${
                      solved
                        ? "text-muted-foreground line-through"
                        : "text-foreground group-hover:text-primary transition-colors"
                    }`}
                  >
                    {idx + 1}. {ex.prompt}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Continue button */}
      <div className="p-5 border-t border-border">
        <Link
          href={continueHref}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-3 hover:opacity-90 transition-opacity"
        >
          {completedCount === totalCount && totalCount > 0 ? "Review" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
