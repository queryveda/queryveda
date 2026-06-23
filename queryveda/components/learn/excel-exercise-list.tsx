"use client";

import { useState, useEffect } from "react";
import { ConceptualQuestion } from "./conceptual-question";
import { ExcelExerciseEditor } from "./excel-exercise-editor";
import { MasteryBar } from "./mastery-bar";
import { Lock, Star } from "lucide-react";
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
  const [allExercisesDone, setAllExercisesDone] = useState(mastery.allExercisesDone);

  // Sync when mastery updates from localStorage/cloud after initial render
  useEffect(() => {
    if (mastery.conceptualDone) setConceptualDone(true);
    if (mastery.allExercisesDone) setAllExercisesDone(true);
  }, [mastery.conceptualDone, mastery.allExercisesDone]);

  const handleConceptualCorrect = (questionId: string) => {
    onConceptualComplete(questionId);
    const allDone = node.conceptualQuestions.every(
      (q) => q.id === questionId || isConceptualCompleted(q.id)
    );
    if (allDone) setConceptualDone(true);
  };

  const handleExerciseComplete = (exerciseId: string) => {
    onExerciseComplete(exerciseId);
    const allDone = node.exercises.every(
      (e) => e.id === exerciseId || isExerciseCompleted(e.id)
    );
    if (allDone) setAllExercisesDone(true);
  };

  const hasBonusContent =
    (node.bonusConceptualQuestions?.length ?? 0) > 0 ||
    (node.bonusExercises?.length ?? 0) > 0;

  const bonusTotal =
    (node.bonusConceptualQuestions?.length ?? 0) +
    (node.bonusExercises?.length ?? 0);
  const bonusCompleted =
    mastery.bonusConceptualCompleted + mastery.bonusExercisesCompleted;

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
                onPass={() => handleExerciseComplete(ex.id)}
              />
            ))}
          </div>
        )}
      </div>

      {hasBonusContent && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Bonus Challenges</h3>
            {bonusTotal > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {bonusCompleted}/{bonusTotal} completed
              </span>
            )}
          </div>
          {!(conceptualDone && allExercisesDone) ? (
            <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center text-muted-foreground">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Complete all core exercises to unlock bonus challenges.</p>
              <p className="text-xs mt-1 opacity-70">
                Bonus items don&apos;t affect your completion percentage.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Extra practice to deepen your skills. These don&apos;t count toward node completion.
              </p>
              {node.bonusConceptualQuestions?.map((q) => (
                <ConceptualQuestion
                  key={q.id}
                  question={q}
                  onCorrect={() => onConceptualComplete(q.id)}
                  alreadyCompleted={isConceptualCompleted(q.id)}
                />
              ))}
              {node.bonusExercises?.map((ex) => (
                <ExcelExerciseEditor
                  key={ex.id}
                  exercise={ex}
                  onPass={() => onExerciseComplete(ex.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
