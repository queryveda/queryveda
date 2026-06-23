"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { ExcelExerciseList } from "@/components/learn/excel-exercise-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ExternalLink, Lightbulb } from "lucide-react";

export function ExcelNodeClient({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const {
    markExerciseCompleted,
    markConceptualCompleted,
    isConceptualCompleted,
    isExerciseCompleted,
    getNodeMastery,
  } = useExcelSkillTree();

  const node = useMemo(
    () => excelSkillTreeNodes.find((n) => n.id === nodeId),
    [nodeId]
  );

  const mastery = getNodeMastery(nodeId);

  if (!node) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Node not found</h1>
        <Button className="mt-4" onClick={() => router.push("/excel")}>
          Back to Excel Skill Tree
        </Button>
      </div>
    );
  }

  if (!mastery.unlocked) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">{node.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Complete prerequisite nodes with at least 60% mastery to unlock.
        </p>
        <Button className="mt-4" onClick={() => router.push("/excel")}>
          Back to Excel Skill Tree
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1.5"
        onClick={() => router.push("/excel")}
      >
        <ArrowLeft className="w-4 h-4" />
        Skill Tree
      </Button>

      <h1 className="text-2xl font-bold">{node.title}</h1>
      <p className="mt-2 text-muted-foreground">{node.description}</p>

      {node.intro && (
        <div className="mt-6 rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="w-5 h-5" />
            <span className="font-semibold text-sm">Before you start</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {node.intro.summary}
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {node.intro.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&#8226;</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          {node.intro.externalUrl && (
            <a
              href={node.intro.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              {node.intro.externalLabel ?? "Learn more"}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <div className="mt-8">
        <ExcelExerciseList
          node={node}
          mastery={mastery}
          onConceptualComplete={markConceptualCompleted}
          onExerciseComplete={markExerciseCompleted}
          isConceptualCompleted={isConceptualCompleted}
          isExerciseCompleted={isExerciseCompleted}
        />
      </div>
    </div>
  );
}
