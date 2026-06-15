"use client";

import { useSkillTree } from "@/hooks/use-skill-tree";
import { SkillTreeMap } from "@/components/learn/skill-tree-map";

export function LearnClient() {
  const { getNodeMastery } = useSkillTree();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Learn SQL
        </h1>
        <p className="text-muted-foreground">
          Master SQL concepts step by step. Complete exercises to unlock new topics.
        </p>
      </div>
      <SkillTreeMap getMastery={getNodeMastery} />
    </div>
  );
}
