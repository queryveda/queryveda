"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StatsCardsProps {
  totalSolved: number;
  totalQuestions: number;
  completionPercent: number;
  streak: number;
}

export function StatsCards({ totalSolved, totalQuestions, completionPercent, streak }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Solved</CardDescription>
          <CardTitle className="text-3xl">{totalSolved}/{totalQuestions}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Completion</CardDescription>
          <CardTitle className="text-3xl">{completionPercent}%</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Current Streak</CardDescription>
          <CardTitle className="text-3xl">{streak} day{streak !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
