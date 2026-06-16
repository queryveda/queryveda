"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./countdown-timer";
import {
  fetchDailyQuestion,
  getDailyState,
  startChallenge,
  syncDailyFromCloud,
  msUntilNextRefresh,
  solveTimerRemaining,
  todayIST,
  type DailyQuestion,
} from "@/lib/daily";

export function DailyHeroCard() {
  const [daily, setDaily] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [started, setStarted] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    fetchDailyQuestion().then((dq) => {
      setDaily(dq);
      setLoading(false);
    });
    const state = getDailyState();
    if (state.startedAt) {
      setStarted(true);
      setSelectedDuration(state.duration ?? 30);
    }
    if (state.solved) {
      setSolved(true);
    } else {
      syncDailyFromCloud().then((cloudSolved) => {
        if (cloudSolved) setSolved(true);
      });
    }
  }, []);

  const getRefreshRemaining = useCallback(() => msUntilNextRefresh(), []);
  const getSolveRemaining = useCallback(() => {
    const state = getDailyState();
    return solveTimerRemaining(state);
  }, []);

  const isStale = daily ? daily.date !== todayIST() : false;
  const showQuestion = daily && !isStale;

  const handleStart = () => {
    startChallenge(selectedDuration);
    setStarted(true);
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-8">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-primary/10 p-[1px]">
        <Card className="rounded-2xl border-0">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>&#128293;</span>
                <CardTitle className="text-xl">Daily SQL Challenge</CardTitle>
                <Badge style={{ backgroundColor: "#f59e0b" }} className="text-white">
                  Medium
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {daily?.date ?? todayIST()}
              </span>
            </div>

            {/* Timers */}
            <div className="flex items-center gap-8 flex-wrap">
              <CountdownTimer label="Next Question In" getRemaining={getRefreshRemaining} />
              {started && !solved && (
                <CountdownTimer label="Solve Timer" getRemaining={getSolveRemaining} />
              )}
            </div>

            {loading && (
              <CardDescription>Loading today&apos;s challenge...</CardDescription>
            )}

            {!loading && !showQuestion && (
              <CardDescription>
                Today&apos;s challenge is being prepared. Check back after 9:00 AM IST!
              </CardDescription>
            )}

            {showQuestion && (
              <>
                <div>
                  <h3 className="font-semibold">{daily.question.title}</h3>
                  <CardDescription className="line-clamp-2 mt-1">
                    {daily.question.desc}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {!started && !solved && (
                    <>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                      </select>
                      <Button onClick={handleStart} className="rounded-full px-6">
                        Start Challenge
                      </Button>
                    </>
                  )}

                  {started && !solved && (
                    <Link href="/daily">
                      <Button className="rounded-full px-6">Continue Challenge</Button>
                    </Link>
                  )}

                  {solved && (
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        Solved!
                      </span>
                      <Link href="/daily">
                        <Button variant="outline" className="rounded-full px-6">
                          View Solution
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
