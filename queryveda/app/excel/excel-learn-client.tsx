"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { MasteryBar } from "@/components/learn/mastery-bar";
import { ExcelSkillTreePanel } from "@/components/learn/excel-skill-tree-panel";
import { ExcelNodeBottomSheet } from "@/components/learn/excel-node-bottom-sheet";
import { Lock, Star, CheckCircle2, ChevronRight } from "lucide-react";
import type { ExcelSkillNode, ExcelNodeMastery } from "@/lib/excel-skill-tree-types";

function ExcelNodeCard({
  node,
  mastery,
  onClick,
}: {
  node: ExcelSkillNode;
  mastery: ExcelNodeMastery;
  onClick?: (node: ExcelSkillNode) => void;
}) {
  const totalCompleted =
    mastery.conceptualCompleted + mastery.exercisesCompleted;
  const totalItems = mastery.conceptualTotal + mastery.exercisesTotal;
  const { percentage, starred } = mastery;
  const isComplete = percentage === 100;
  const inProgress = percentage > 0 && percentage < 100;
  const notStarted = percentage === 0;

  if (!mastery.unlocked) {
    return (
      <div className="flex flex-col items-center gap-3 w-[160px]">
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
          <Lock className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <span className="text-sm text-muted-foreground/50 text-center font-medium">
          {node.title}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(node)}
      className="flex flex-col items-center gap-3 w-[160px] group bg-transparent border-none p-0 cursor-pointer"
    >
      <div className="relative">
        {(starred || isComplete) && (
          <div
            className={`absolute -inset-1 rounded-2xl blur-md opacity-40 ${
              starred ? "bg-yellow-500" : "bg-primary"
            }`}
          />
        )}
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5 ${
            starred
              ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
              : isComplete
              ? "bg-gradient-to-br from-primary/20 to-violet-500/10 border-2 border-primary/50 shadow-lg shadow-primary/20"
              : inProgress
              ? "bg-gradient-to-br from-primary/15 to-violet-500/5 border-2 border-primary/30 shadow-md shadow-primary/10"
              : "bg-gradient-to-br from-muted/60 to-muted/30 border-2 border-border group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/10"
          }`}
        >
          {starred ? (
            <Star className="w-7 h-7 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          ) : isComplete ? (
            <CheckCircle2 className="w-7 h-7 text-primary drop-shadow-sm" />
          ) : inProgress ? (
            <span className="text-base font-bold text-primary">{percentage}%</span>
          ) : (
            <ChevronRight className="w-6 h-6 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>

      <span
        className={`text-sm font-semibold text-center leading-tight transition-colors ${
          starred
            ? "text-yellow-500"
            : isComplete
            ? "text-primary"
            : "text-foreground/80 group-hover:text-primary"
        }`}
      >
        {node.title}
      </span>

      {inProgress && (
        <div className="w-28">
          <MasteryBar
            completed={totalCompleted}
            total={totalItems}
            showLabel={false}
          />
        </div>
      )}

      {notStarted && (
        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider group-hover:text-primary/60 transition-colors">
          Start
        </span>
      )}
    </button>
  );
}

export function ExcelLearnClient() {
  const { getNodeMastery } = useExcelSkillTree();
  const [selectedNode, setSelectedNode] = useState<ExcelSkillNode | null>(null);

  // Group nodes by row (same approach as SQL skill tree)
  const sortedRows = useMemo(() => {
    const rows = new Map<number, ExcelSkillNode[]>();
    for (const node of excelSkillTreeNodes) {
      const row = rows.get(node.row) ?? [];
      row.push(node);
      rows.set(node.row, row);
    }
    return Array.from(rows.entries()).sort(([a], [b]) => a - b);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-height,0px))] overflow-hidden">
      {/* Track switcher + heading — matches Learn SQL layout */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Learn Excel</h1>
        <div className="flex rounded-full bg-muted p-0.5">
          <Link
            href="/learn"
            className="px-3 py-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            SQL
          </Link>
          <Link
            href="/excel"
            className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground transition-colors"
          >
            Excel
          </Link>
        </div>
      </div>

      {/* Two-panel layout — matches Learn SQL */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: skill tree */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
                      <ExcelNodeCard
                        key={node.id}
                        node={node}
                        mastery={getNodeMastery(node.id)}
                        onClick={setSelectedNode}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail panel (desktop only) */}
        <div className="hidden lg:flex flex-col w-[320px] border-l border-border overflow-hidden">
          <ExcelSkillTreePanel node={selectedNode} />
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        <ExcelNodeBottomSheet
          node={selectedNode}
          open={!!selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}
