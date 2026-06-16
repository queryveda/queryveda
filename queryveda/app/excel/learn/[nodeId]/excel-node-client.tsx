"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { ExcelExerciseList } from "@/components/learn/excel-exercise-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";

export function ExcelNodeClient({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const {
    markExerciseCompleted,
    markConceptualCompleted,
    isExerciseCompleted,
    isConceptualCompleted,
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
