"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSkillNode } from "@/lib/skill-tree-data";
import { questions } from "@/lib/questions";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { usePGlite } from "@/hooks/use-pglite";
import { MasteryBar } from "@/components/learn/mastery-bar";
import { ExerciseList } from "@/components/learn/exercise-list";
import { MicroExerciseEditor } from "@/components/learn/micro-exercise-editor";
import { Button } from "@/components/ui/button";

export function NodeClient({ nodeId }: { nodeId: string }) {
  const node = getSkillNode(nodeId);
  const { db, ready } = usePGlite();
  const { markCompleted, isExerciseCompleted, getNodeMastery } = useSkillTree();
  const mastery = getNodeMastery(nodeId);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(
    node?.exercises[0]?.id ?? null
  );

  const activeExercise = node?.exercises.find((e) => e.id === activeExerciseId);

  const handlePass = useCallback(() => {
    if (!activeExerciseId) return;
    markCompleted(activeExerciseId);
    // Auto-advance to next incomplete exercise after a delay
    if (node) {
      setTimeout(() => {
        const nextIncomplete = node.exercises.find(
          (e) => e.id !== activeExerciseId && !isExerciseCompleted(e.id)
        );
        if (nextIncomplete) {
          setActiveExerciseId(nextIncomplete.id);
        }
      }, 1500);
    }
  }, [activeExerciseId, markCompleted, node, isExerciseCompleted]);

  if (!node) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Node not found.</p>
        <Link href="/learn" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to skill tree
        </Link>
      </div>
    );
  }

  if (!mastery.unlocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-medium mb-2">Locked</p>
        <p className="text-muted-foreground mb-4">
          Complete prerequisite topics to unlock {node.title}.
        </p>
        <Link href="/learn">
          <Button variant="outline">Back to skill tree</Button>
        </Link>
      </div>
    );
  }

  const relatedProblems = questions.filter((q) =>
    node.relatedProblemIds.includes(q.id)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Skill Tree
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mb-1">{node.title}</h1>
        <p className="text-muted-foreground text-sm mb-3">{node.description}</p>
        <div className="max-w-xs">
          <MasteryBar completed={mastery.completed} total={mastery.total} />
        </div>
      </div>

      {/* Two-column layout: exercise list + active exercise */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Left: exercise list */}
        <div className="rounded-xl border p-3">
          <ExerciseList
            exercises={node.exercises}
            isCompleted={isExerciseCompleted}
            activeExerciseId={activeExerciseId}
            onSelect={setActiveExerciseId}
          />
        </div>

        {/* Right: active exercise editor */}
        <div className="rounded-xl border p-4">
          {!ready || !db ? (
            <p className="text-sm text-muted-foreground">Loading SQL engine...</p>
          ) : activeExercise ? (
            <MicroExerciseEditor
              key={activeExerciseId}
              exercise={activeExercise}
              db={db}
              onPass={handlePass}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select an exercise to begin.</p>
          )}
        </div>
      </div>

      {/* Related problems */}
      {relatedProblems.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Ready for a challenge?</h2>
          <div className="flex flex-wrap gap-2">
            {relatedProblems.map((q) => (
              <Link key={q.id} href={`/practice/${q.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  {q.title}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
