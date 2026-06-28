"use client";

import { skillTreeNodes } from "@/lib/skill-tree-data";
import { SkillNodeCard } from "./skill-node-card";
import type { NodeMastery, SkillNode } from "@/lib/skill-tree-types";

interface SkillTreeMapProps {
  getMastery: (nodeId: string) => NodeMastery;
  onNodeClick?: (node: SkillNode) => void;
}

export function SkillTreeMap({ getMastery, onNodeClick }: SkillTreeMapProps) {
  // Group nodes by row
  const rows = new Map<number, typeof skillTreeNodes>();
  for (const node of skillTreeNodes) {
    const row = rows.get(node.row) ?? [];
    row.push(node);
    rows.set(node.row, row);
  }

  const sortedRows = Array.from(rows.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {sortedRows.map(([rowIdx, nodes]) => (
        <div key={rowIdx} className="flex flex-col items-center gap-2">
          {rowIdx > 0 && (
            <div className="w-px h-8 bg-muted-foreground/20" />
          )}
          <div className="flex items-start gap-12 flex-wrap justify-center">
            {nodes
              .sort((a, b) => a.column - b.column)
              .map((node) => (
                <SkillNodeCard
                  key={node.id}
                  node={node}
                  mastery={getMastery(node.id)}
                  onNodeClick={onNodeClick}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
