"use client";

import Link from "next/link";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { MasteryBar } from "@/components/learn/mastery-bar";
import { Lock, Star, CheckCircle2 } from "lucide-react";

export function ExcelLearnClient() {
  const { getNodeMastery } = useExcelSkillTree();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Excel Skill Tree</h1>
        <p className="mt-2 text-muted-foreground">
          Master Excel formulas from the ground up — cell references to advanced analytics.
        </p>
      </div>

      <div className="relative">
        {/* Trunk line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden sm:block" />

        <div className="space-y-6">
          {excelSkillTreeNodes.map((node) => {
            const mastery = getNodeMastery(node.id);
            const totalCompleted = mastery.conceptualCompleted + mastery.exercisesCompleted;
            const totalItems = mastery.conceptualTotal + mastery.exercisesTotal;

            return (
              <div
                key={node.id}
                className={`relative ${
                  node.column === 0
                    ? "sm:mx-auto sm:max-w-sm"
                    : node.column < 0
                    ? "sm:mr-auto sm:ml-8 sm:max-w-sm"
                    : "sm:ml-auto sm:mr-8 sm:max-w-sm"
                }`}
              >
                {!mastery.unlocked ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/40">
                      <Lock className="w-5 h-5 text-muted-foreground/70" />
                    </div>
                    <span className="text-sm text-muted-foreground/80 text-center max-w-[140px]">
                      {node.title}
                    </span>
                  </div>
                ) : (
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
