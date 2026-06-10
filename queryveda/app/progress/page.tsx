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

  const achievements = useMemo(() => storage.getAchievements(questions), []);

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
