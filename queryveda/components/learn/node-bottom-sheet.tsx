"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, X } from "lucide-react";
import { skillTreeStorage } from "@/lib/skill-tree-storage";
import { useAuth } from "@/hooks/use-auth";
import type { SkillNode } from "@/lib/skill-tree-types";

interface NodeBottomSheetProps {
  node: SkillNode | null;
  open: boolean;
  onClose: () => void;
}

export function NodeBottomSheet({ node, open, onClose }: NodeBottomSheetProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const isSolved = (id: string) => !!user && skillTreeStorage.isExerciseCompleted(id);

  const exercises = node?.exercises ?? [];
  const completedCount = exercises.filter((ex) => isSolved(ex.id)).length;
  const totalCount = exercises.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const firstUnsolved = exercises.find((ex) => !isSolved(ex.id));
  const continueHref = node
    ? firstUnsolved
      ? `/learn/${node.id}?exercise=${firstUnsolved.id}`
      : `/learn/${node.id}`
    : "#";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 flex flex-col bg-card rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "65vh" }}
        role="dialog"
        aria-modal="true"
        aria-label={node?.title ?? "Node detail"}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {node ? (
          <>
            {/* Header */}
            <div className="px-5 pt-2 pb-3 border-b border-border shrink-0">
              <h2 className="text-base font-bold leading-tight">{node.title}</h2>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {node.description}
              </p>
            </div>

            {/* Progress */}
            <div className="px-5 py-3 border-b border-border shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Progress
                </span>
                <span className="text-xs font-semibold">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <ul className="space-y-1.5">
                {exercises.map((ex, idx) => {
                  const solved = isSolved(ex.id);
                  return (
                    <li key={ex.id}>
                      <Link
                        href={`/learn/${node.id}?exercise=${ex.id}`}
                        onClick={onClose}
                        className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors"
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
                              : "text-foreground"
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
            <div className="px-5 py-4 border-t border-border shrink-0">
              <Link
                href={continueHref}
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-3 hover:opacity-90 transition-opacity"
              >
                {completedCount === totalCount && totalCount > 0
                  ? "Review"
                  : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
