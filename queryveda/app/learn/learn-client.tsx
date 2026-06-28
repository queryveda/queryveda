"use client";

import { useState } from "react";
import Link from "next/link";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { SkillTreeMap } from "@/components/learn/skill-tree-map";
import { SkillTreePanel } from "@/components/learn/skill-tree-panel";
import { NodeBottomSheet } from "@/components/learn/node-bottom-sheet";
import type { SkillNode } from "@/lib/skill-tree-types";

export function LearnClient() {
  const { getNodeMastery } = useSkillTree();
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-height,0px))] overflow-hidden">
      {/* Track switcher + heading */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Learn SQL</h1>
        <div className="flex rounded-full bg-muted p-0.5">
          <Link
            href="/learn"
            className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground transition-colors"
          >
            SQL
          </Link>
          <Link
            href="/excel"
            className="px-3 py-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Excel
          </Link>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: skill tree map */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <SkillTreeMap getMastery={getNodeMastery} onNodeClick={setSelectedNode} />
        </div>

        {/* Right: detail panel (desktop only) */}
        <div className="hidden lg:flex flex-col w-[320px] border-l border-border overflow-hidden">
          <SkillTreePanel node={selectedNode} />
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        <NodeBottomSheet
          node={selectedNode}
          open={!!selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}
