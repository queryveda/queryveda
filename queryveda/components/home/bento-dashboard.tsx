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
import { DashboardGreeting } from "./dashboard-greeting";
import { Button } from "@/components/ui/button";
import {
  Zap, BarChart3, RotateCcw, Trophy, ArrowRight, BookOpen, Table2,
  Target, Flame, CheckCircle2, Code2
} from "lucide-react";

/* ─── Hero banner with gradient background ─── */
function HeroBanner() {
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/5 border border-orange-500/20 p-6">
      {/* Decorative orbs */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Daily Challenge</span>
          </div>
          {daily ? (
            <>
              <h3 className="text-lg font-bold mb-1">{daily.question.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {daily.question.difficulty} &middot; {daily.question.topic}
              </p>
              <Link href="/daily">
                <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 px-6">
                  {solved ? "View Solution" : started ? "Continue" : "Solve Now"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Check back after 9:00 AM IST</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Stats row — big numbers like StrataScratch ─── */
function StatsRow() {
  const questions = getSortedQuestions();
  const solved = storage.countSolved(questions);
  const streak = storage.getCurrentStreak();
  const total = questions.length;

  const stats = [
    { label: "Solved", value: solved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total", value: total, icon: Code2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Streak", value: `${streak}d`, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Accuracy", value: `${total > 0 ? Math.round((solved / total) * 100) : 0}%`, icon: Target, color: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </div>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Progress card with gradient bar ─── */
function ProgressCard() {
  const questions = getSortedQuestions();
  const solved = storage.countSolved(questions);
  const total = questions.length;
  const pct = Math.round((solved / total) * 100);

  const easy = questions.filter(q => q.difficulty === "Easy");
  const medium = questions.filter(q => q.difficulty === "Medium");
  const hard = questions.filter(q => q.difficulty === "Hard");
  const easySolved = easy.filter(q => storage.isSolved(q.id)).length;
  const medSolved = medium.filter(q => storage.isSolved(q.id)).length;
  const hardSolved = hard.filter(q => storage.isSolved(q.id)).length;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Your Progress</h3>
          <p className="text-xs text-muted-foreground">{pct}% complete</p>
        </div>
      </div>

      {/* Overall bar */}
      <div className="w-full h-3 rounded-full bg-muted/60 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Difficulty breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-500">{easySolved}/{easy.length}</p>
          <p className="text-[11px] text-muted-foreground">Easy</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-500">{medSolved}/{medium.length}</p>
          <p className="text-[11px] text-muted-foreground">Medium</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">{hardSolved}/{hard.length}</p>
          <p className="text-[11px] text-muted-foreground">Hard</p>
        </div>
      </div>

      <Link href="/progress" className="block mt-4">
        <Button variant="outline" size="sm" className="rounded-full w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
          View Details
        </Button>
      </Link>
    </div>
  );
}

/* ─── Review queue ─── */
function ReviewQueueCard() {
  const { user } = useAuth();
  const dueReviews = user ? getDueReviews() : [];

  if (dueReviews.length === 0) return null;

  const bucketCounts = { hard: 0, medium: 0, easy: 0 };
  for (const r of dueReviews) {
    bucketCounts[r.bucket]++;
  }

  return (
    <div className="col-span-2 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/25">
            <RotateCcw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Review Queue</h3>
            <p className="text-xs text-muted-foreground">{dueReviews.length} items due for review</p>
          </div>
        </div>
        <div className="flex gap-2">
          {bucketCounts.hard > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-500 font-semibold">{bucketCounts.hard} hard</span>
          )}
          {bucketCounts.medium > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 font-semibold">{bucketCounts.medium} med</span>
          )}
          {bucketCounts.easy > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 font-semibold">{bucketCounts.easy} easy</span>
          )}
        </div>
        <Link href={`/practice/${dueReviews[0].questionId}/`}>
          <Button size="sm" className="rounded-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/25 px-5">
            Start Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Next up + Leaderboard row ─── */
function NextUpCard() {
  const questions = getSortedQuestions();
  const suggestion = useMemo(() => {
    const unsolved = questions.filter((q) => !storage.isSolved(q.id));
    if (unsolved.length === 0) return null;
    return getNextSuggestion(unsolved[0], storage.isSolved);
  }, [questions]);

  if (!suggestion) return null;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Next Up</h3>
          <p className="text-xs text-muted-foreground">{suggestion.topic}</p>
        </div>
      </div>
      <Link href={`/practice/${suggestion.id}/`}>
        <Button size="sm" className="rounded-full w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          Start Solving <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

function LeaderboardCard() {
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Leaderboard</h3>
          <p className="text-xs text-muted-foreground">See top performers</p>
        </div>
      </div>
      <Link href="/leaderboard">
        <Button variant="outline" size="sm" className="rounded-full w-full border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
          View Rankings
        </Button>
      </Link>
    </div>
  );
}

/* ─── Learning tracks ─── */
function TrackCards() {
  const { hasTrack } = useTrack();

  return (
    <>
      {hasTrack("sql") && (
        <Link href="/learn" className="block">
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 via-purple-500/5 to-transparent p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">SQL Track</h3>
                <p className="text-xs text-muted-foreground">Step-by-step skill tree with guided exercises</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </div>
          </div>
        </Link>
      )}
      {hasTrack("excel") && (
        <Link href="/excel" className="block">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-teal-500/15 via-emerald-500/5 to-transparent p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Table2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Excel Track</h3>
                <p className="text-xs text-muted-foreground">Master formulas from cell references to analytics</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </div>
          </div>
        </Link>
      )}
    </>
  );
}

/* ─── Logged-out hero ─── */
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "75+", label: "SQL Problems", color: "text-violet-500", bg: "from-violet-500/10" },
          { value: "100%", label: "Free Forever", color: "text-emerald-500", bg: "from-emerald-500/10" },
          { value: "0", label: "Installs Needed", color: "text-blue-500", bg: "from-blue-500/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-border/50 bg-gradient-to-br ${s.bg} to-transparent p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <HeroBanner />

      <div className="grid grid-cols-2 gap-3">
        <Link href="/learn" className="block">
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-transparent p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Learn SQL</h3>
                <p className="text-xs text-muted-foreground">Step-by-step skill tree</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/excel" className="block">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-transparent p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Table2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Learn Excel</h3>
                <p className="text-xs text-muted-foreground">Interactive spreadsheets</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ─── Main dashboard ─── */
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
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <DashboardGreeting />

      {/* Hero: Daily Challenge */}
      <HeroBanner />

      {/* Stats row */}
      <StatsRow />

      {/* Progress + Next Up / Leaderboard */}
      <div className="grid grid-cols-2 gap-3">
        <ProgressCard />
        <div className="flex flex-col gap-3">
          <NextUpCard />
          <LeaderboardCard />
        </div>
      </div>

      {/* Review Queue (conditional) */}
      <ReviewQueueCard />

      {/* Learning Tracks */}
      <div className="grid grid-cols-2 gap-3">
        <TrackCards />
      </div>
    </div>
  );
}
