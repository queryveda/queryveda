"use client";

import { useState } from "react";
import { ConceptualQuestion } from "./conceptual-question";
import { ExcelExerciseEditor } from "./excel-exercise-editor";
import { MasteryBar } from "./mastery-bar";
import { Lock } from "lucide-react";
import type { ExcelSkillNode, ExcelNodeMastery } from "@/lib/excel-skill-tree-types";

interface ExcelExerciseListProps {
  node: ExcelSkillNode;
  mastery: ExcelNodeMastery;
  onConceptualComplete: (questionId: string) => void;
  onExerciseComplete: (exerciseId: string) => void;
  isConceptualCompleted: (questionId: string) => boolean;
  isExerciseCompleted: (exerciseId: string) => boolean;
}

export function ExcelExerciseList({
  node,
  mastery,
  onConceptualComplete,
  onExerciseComplete,
  isConceptualCompleted,
  isExerciseCompleted,
}: ExcelExerciseListProps) {
  const [conceptualDone, setConceptualDone] = useState(mastery.conceptualDone);

  const handleConceptualCorrect = (questionId: string) => {
    onConceptualComplete(questionId);
    const allDone = node.conceptualQuestions.every(
      (q) => q.id === questionId || isConceptualCompleted(q.id)
    );
    if (allDone) setConceptualDone(true);
  };

  return (
    <div className="space-y-8">
      <MasteryBar
        completed={mastery.conceptualCompleted + mastery.exercisesCompleted}
        total={mastery.conceptualTotal + mastery.exercisesTotal}
      />

      {node.conceptualQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Warm-up Questions</h3>
          <p className="text-sm text-muted-foreground">
            Answer these concept questions to unlock hands-on exercises.
          </p>
          {node.conceptualQuestions.map((q) => (
            <ConceptualQuestion
              key={q.id}
              question={q}
              onCorrect={() => handleConceptualCorrect(q.id)}
              alreadyCompleted={isConceptualCompleted(q.id)}
            />
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Hands-on Exercises</h3>
        {!conceptualDone ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Complete all warm-up questions to unlock exercises.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {node.exercises.map((ex) => (
              <ExcelExerciseEditor
                key={ex.id}
                exercise={ex}
                onPass={() => onExerciseComplete(ex.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
