"use client";

import { CheckCircle2, Circle, PenLine, Layers, Wrench } from "lucide-react";
import type { MicroExercise } from "@/lib/skill-tree-types";

interface ExerciseListProps {
  exercises: MicroExercise[];
  isCompleted: (exerciseId: string) => boolean;
  activeExerciseId: string | null;
  onSelect: (exerciseId: string) => void;
}

const TYPE_ICONS = {
  "fill-blank": PenLine,
  "build-incremental": Layers,
  "fix-query": Wrench,
};

const TYPE_LABELS = {
  "fill-blank": "Fill in the blank",
  "build-incremental": "Build step by step",
  "fix-query": "Fix the query",
};

export function ExerciseList({
  exercises,
  isCompleted,
  activeExerciseId,
  onSelect,
}: ExerciseListProps) {
  return (
    <div className="flex flex-col gap-1">
      {exercises.map((ex, i) => {
        const done = isCompleted(ex.id);
        const active = ex.id === activeExerciseId;
        const Icon = TYPE_ICONS[ex.type];

        return (
          <button
            key={ex.id}
            onClick={() => onSelect(ex.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-foreground"
            }`}
          >
            {done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="flex-1 truncate">
              Exercise {i + 1}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="w-3 h-3" />
              {TYPE_LABELS[ex.type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
