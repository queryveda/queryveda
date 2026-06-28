"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTrack } from "@/hooks/use-track";
import { storage } from "@/lib/storage";
import { getSortedQuestions } from "@/lib/questions";
import { getDueReviews } from "@/lib/review";
import { getNextSuggestion } from "@/lib/next-question";
import { fetchDailyQuestion, getDailyState, todayIST, type DailyQuestion } from "@/lib/daily";
import { BentoCard } from "./bento-card";
import { DashboardGreeting } from "./dashboard-greeting";
import { Button } from "@/components/ui/button";
import { Zap, BarChart3, RotateCcw, Trophy, ArrowRight, BookOpen, Table2 } from "lucide-react";

function DailyCard() {
  const [daily, setDaily] = useState<DailyQuestion | null>(null);
  const [solved, setSolved] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchDailyQuestion().then((dq) => {
      if (dq && dq.date === todayIST()) {
        setDaily(dq);
        const state = getDailyState();
        setSolved(state.solved);
        setStarted(!!state.startedAt);
      }
    });
  }, []);

  return (
    <BentoCard>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Daily Challenge</h3>
        </div>
        {daily ? (
          <>
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
              &ldquo;{daily.question.title}&rdquo;
            </p>
            <Link href="/daily">
              <Button size="sm" className="rounded-full w-full">
                {solved ? "View Solution" : started ? "Continue" : "Solve Now"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground flex-1">
            Check back after 9:00 AM IST
          </p>
        )}
      </div>
    </BentoCard>
  );
}

function ProgressCard() {
  const questions = getSortedQuestions();
  const solved = storage.countSolved(questions);
  const total = questions.length;
  const pct = Math.round((solved / total) * 100);

  return (
    <BentoCard>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Your Progress</h3>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">{solved}</span>
            <span className="text-sm text-muted-foreground">/ {total} solved</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link href="/progress">
          <Button variant="outline" size="sm" className="rounded-full w-full">
            View Details
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function ReviewQueueCard() {
  const { user } = useAuth();
  const dueReviews = user ? getDueReviews() : [];

  if (dueReviews.length === 0) return null;

  const bucketCounts = { hard: 0, medium: 0, easy: 0 };
  for (const r of dueReviews) {
    bucketCounts[r.bucket]++;
  }

  return (
    <BentoCard>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold">Review Queue</h3>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{dueReviews.length}</p>
          <p className="text-sm text-muted-foreground">
            items due
          </p>
          <div className="flex gap-2 mt-2">
            {bucketCounts.hard > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">{bucketCounts.hard} hard</span>
            )}
            {bucketCounts.medium > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">{bucketCounts.medium} med</span>
            )}
            {bucketCounts.easy > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">{bucketCounts.easy} easy</span>
            )}
          </div>
        </div>
        <Link href={`/practice/${dueReviews[0].questionId}/`}>
          <Button size="sm" className="rounded-full w-full">
            Start Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function RankCard() {
  return (
    <BentoCard>
      <div className="flex flex-col gap-2 h-full items-center justify-center text-center">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="font-semibold text-sm">Leaderboard</h3>
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm" className="rounded-full text-xs">
            View Rankings
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function NextQuestionCard() {
  const questions = getSortedQuestions();
  const suggestion = useMemo(() => {
    const unsolved = questions.filter((q) => !storage.isSolved(q.id));
    if (unsolved.length === 0) return null;
    return getNextSuggestion(unsolved[0], storage.isSolved);
  }, [questions]);

  if (!suggestion) return null;

  return (
    <BentoCard>
      <div className="flex flex-col gap-2 h-full items-center justify-center text-center">
        <ArrowRight className="w-6 h-6 text-primary" />
        <h3 className="font-semibold text-sm">Next Up</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.topic}</p>
        <Link href={`/practice/${suggestion.id}/`}>
          <Button size="sm" className="rounded-full text-xs">
            Go <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function SkillTreeCards() {
  const { hasTrack } = useTrack();

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {hasTrack("sql") && (
        <Link href="/learn" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">SQL Track</h3>
                <p className="text-xs text-muted-foreground">Continue learning</p>
              </div>
            </div>
          </BentoCard>
        </Link>
      )}
      {hasTrack("excel") && (
        <Link href="/excel" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Excel Track</h3>
                <p className="text-xs text-muted-foreground">Continue learning</p>
              </div>
            </div>
          </BentoCard>
        </Link>
      )}
    </div>
  );
}

function LoggedOutHero() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
          Master{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--qv-gradient-accent)" }}>
            SQL & Excel
          </span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Structured lessons + hands-on practice. No installations.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DailyCard />
        <BentoCard>
          <div className="flex flex-col gap-3 h-full">
            <h3 className="font-semibold">Start Your Journey</h3>
            <ul className="text-sm text-muted-foreground space-y-2 flex-1">
              <li>75+ curated SQL problems</li>
              <li>In-browser PostgreSQL & Excel</li>
              <li>Progress tracking & streaks</li>
            </ul>
          </div>
        </BentoCard>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        <Link href="/learn" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Learn SQL</h3>
                <p className="text-xs text-muted-foreground">Step-by-step skill tree</p>
              </div>
            </div>
          </BentoCard>
        </Link>
        <Link href="/excel" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Learn Excel</h3>
                <p className="text-xs text-muted-foreground">Interactive spreadsheets</p>
              </div>
            </div>
          </BentoCard>
        </Link>
      </div>
    </div>
  );
}

export function BentoDashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <LoggedOutHero />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <DashboardGreeting />

      {/* Row 1: Daily + Progress — large cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <DailyCard />
        <ProgressCard />
      </div>

      {/* Row 2: Review + Rank + Next — medium + small cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <ReviewQueueCard />
        </div>
        <RankCard />
        <NextQuestionCard />
      </div>

      {/* Row 3: Skill Trees */}
      <SkillTreeCards />
    </div>
  );
}
