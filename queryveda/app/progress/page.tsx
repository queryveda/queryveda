"use client";

import { useMemo } from "react";
import { questions } from "@/lib/questions";
import { storage } from "@/lib/storage";
import { TOPICS } from "@/lib/constants";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { StatsCards } from "@/components/progress/stats-cards";
import { ProgressBars } from "@/components/progress/progress-bars";
import { SkillRadar } from "@/components/progress/skill-radar";
import { Achievements } from "@/components/progress/achievements";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { skillTreeNodes } from "@/lib/skill-tree-data";
import { MasteryBar } from "@/components/learn/mastery-bar";
import { useExcelSkillTree } from "@/hooks/use-excel-skill-tree";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import Link from "next/link";

function ProgressContent() {
  const totalQuestions = questions.length;

  const totalSolved = useMemo(() => storage.countSolved(questions), []);

  const completionPercent = useMemo(
    () => (totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0),
    [totalSolved, totalQuestions]
  );

  const streak = useMemo(() => storage.getCurrentStreak(), []);

  const byDifficulty = useMemo(
    () => ({
      Easy: storage.countByDifficulty(questions, "Easy"),
      Medium: storage.countByDifficulty(questions, "Medium"),
      Hard: storage.countByDifficulty(questions, "Hard"),
    }),
    []
  );

  const byTopic = useMemo(
    () =>
      TOPICS.map((topic) => ({
        topic,
        ...storage.countByTopic(questions, topic),
      })),
    []
  );

  const sqlAchievements = useMemo(() => storage.getAchievements(questions), []);

  const { getNodeMastery } = useSkillTree();

  const { getNodeMastery: getExcelNodeMastery, masteries: excelMasteries } = useExcelSkillTree();

  const excelTotalCompleted = useMemo(
    () =>
      excelMasteries.reduce(
        (sum, m) => sum + m.conceptualCompleted + m.exercisesCompleted,
        0
      ),
    [excelMasteries]
  );

  const excelTotalItems = useMemo(
    () =>
      excelSkillTreeNodes.reduce(
        (sum, node) =>
          sum + node.conceptualQuestions.length + node.exercises.length,
        0
      ),
    []
  );

  const excelStarredCount = excelMasteries.filter((m) => m.starred).length;

  const excelAchievements = useMemo(
    () => [
      {
        id: "excel-first-formula",
        name: "First Formula",
        desc: "Complete your first Excel exercise",
        icon: "📊",
        unlocked: excelTotalCompleted >= 1,
      },
      {
        id: "excel-warmup-king",
        name: "Warmup King",
        desc: "Answer 10 conceptual questions",
        icon: "🧩",
        unlocked:
          excelMasteries.reduce((s, m) => s + m.conceptualCompleted, 0) >= 10,
      },
      {
        id: "excel-cell-master",
        name: "Cell Master",
        desc: "Star the Cell References node",
        icon: "📍",
        unlocked: excelMasteries.find((m) => m.nodeId === "cell-references")?.starred ?? false,
      },
      {
        id: "excel-halfway",
        name: "Spreadsheet Student",
        desc: "Complete 50% of all Excel content",
        icon: "📈",
        unlocked: excelTotalItems > 0 && excelTotalCompleted >= excelTotalItems / 2,
      },
      {
        id: "excel-3-stars",
        name: "Triple Star",
        desc: "Star 3 Excel skill nodes",
        icon: "⭐",
        unlocked: excelStarredCount >= 3,
      },
      {
        id: "excel-all-stars",
        name: "Excel Grandmaster",
        desc: "Star all Excel skill nodes",
        icon: "👑",
        unlocked: excelStarredCount >= excelSkillTreeNodes.length,
      },
    ],
    [excelTotalCompleted, excelTotalItems, excelMasteries, excelStarredCount]
  );

  const achievements = useMemo(
    () => [...sqlAchievements, ...excelAchievements],
    [sqlAchievements, excelAchievements]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Progress</h1>
      <div className="flex flex-col gap-8">
        <StatsCards
          totalSolved={totalSolved}
          totalQuestions={totalQuestions}
          completionPercent={completionPercent}
          streak={streak}
        />
        <ProgressBars byDifficulty={byDifficulty} byTopic={byTopic} />
        <div>
          <h3 className="mb-4 font-semibold">Skill Radar</h3>
          <SkillRadar byTopic={byTopic} />
        </div>
        <div className="rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">SQL Learning Progress</h2>
            <Link href="/learn" className="text-sm text-primary hover:underline">
              View SQL Skill Tree
            </Link>
          </div>
          <div className="space-y-3">
            {skillTreeNodes.map((node) => {
              const m = getNodeMastery(node.id);
              return (
                <div key={node.id} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate">{node.title}</span>
                  <div className="flex-1">
                    <MasteryBar completed={m.completed} total={m.total} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Excel Learning Progress</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {excelTotalCompleted} / {excelTotalItems} exercises &amp; concepts completed
                </p>
              </div>
              <Link href="/excel" className="text-sm text-primary hover:underline">
                View Excel Skill Tree
              </Link>
            </div>
            <div className="space-y-3">
              {excelSkillTreeNodes.map((node) => {
                const m = getExcelNodeMastery(node.id);
                const completed = m.conceptualCompleted + m.exercisesCompleted;
                const total = m.conceptualTotal + m.exercisesTotal;
                return (
                  <div key={node.id} className="flex items-center gap-3">
                    <span className="text-sm w-48 truncate">{node.title}</span>
                    <div className="flex-1">
                      <MasteryBar completed={completed} total={total} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        <Achievements achievements={achievements} />
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <ProtectedRoute>
      <ProgressContent />
    </ProtectedRoute>
  );
}
