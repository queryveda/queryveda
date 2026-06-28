"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { MasteryBar } from "@/components/learn/mastery-bar";
import { Lock, Star, CheckCircle2 } from "lucide-react";
import type { ExcelSkillNode, ExcelNodeMastery } from "@/lib/excel-skill-tree-types";

function ExcelNodeCard({
  node,
  mastery,
}: {
  node: ExcelSkillNode;
  mastery: ExcelNodeMastery;
}) {
  const totalCompleted =
    mastery.conceptualCompleted + mastery.exercisesCompleted;
  const totalItems = mastery.conceptualTotal + mastery.exercisesTotal;

  if (!mastery.unlocked) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/40">
          <Lock className="w-5 h-5 text-muted-foreground/70" />
        </div>
        <span className="text-sm text-muted-foreground/80 text-center max-w-[140px]">
          {node.title}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/excel/learn/${node.id}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
          mastery.starred
            ? "border-yellow-500 bg-yellow-500/10 shadow-md shadow-yellow-500/15"
            : mastery.percentage > 0
            ? "border-primary bg-primary/10 shadow-md shadow-primary/15"
            : "border-muted-foreground/30 bg-card group-hover:border-primary/40 group-hover:shadow-sm group-hover:shadow-primary/10"
        }`}
      >
        {mastery.starred ? (
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        ) : mastery.percentage === 100 ? (
          <CheckCircle2 className="w-6 h-6 text-primary" />
        ) : (
          <span className="text-xs font-bold text-muted-foreground">
            {mastery.percentage > 0 ? `${mastery.percentage}%` : "Start"}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-center max-w-[140px] group-hover:text-primary transition-colors">
        {node.title}
      </span>
      {mastery.percentage > 0 && mastery.percentage < 100 && (
        <div className="w-24">
          <MasteryBar
            completed={totalCompleted}
            total={totalItems}
            showLabel={false}
          />
        </div>
      )}
    </Link>
  );
}

export function ExcelLearnClient() {
  const { getNodeMastery } = useExcelSkillTree();

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
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
