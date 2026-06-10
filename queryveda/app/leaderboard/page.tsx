"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type TimePeriod = "all" | "month" | "week";

interface LeaderboardRow {
  user_id: string;
  solved: number;
  active_days: number;
  completion: number;
}

const TOTAL_QUESTIONS = 75;

function getDateCutoff(period: TimePeriod): string | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "month") {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
  } else {
    // this week: Sunday
    const day = now.getDay();
    now.setDate(now.getDate() - day);
    now.setHours(0, 0, 0, 0);
  }
  return now.toISOString();
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>("all");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_progress")
        .select("user_id, status, solved_at")
        .eq("status", "solved");

      const cutoff = getDateCutoff(period);
      if (cutoff) {
        query = query.gte("solved_at", cutoff);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by user_id
      const map = new Map<string, { solved: number; days: Set<string> }>();
      for (const row of data || []) {
        if (!map.has(row.user_id)) {
          map.set(row.user_id, { solved: 0, days: new Set() });
        }
        const entry = map.get(row.user_id)!;
        entry.solved += 1;
        if (row.solved_at) {
          entry.days.add(row.solved_at.slice(0, 10));
        }
      }

      const leaderboard: LeaderboardRow[] = Array.from(map.entries())
        .map(([user_id, { solved, days }]) => ({
          user_id,
          solved,
          active_days: days.size,
          completion: Math.round((solved / TOTAL_QUESTIONS) * 100),
        }))
        .sort((a, b) => b.solved - a.solved);

      setRows(leaderboard);
    } catch (e) {
      console.error("Leaderboard fetch failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const periodLabels: Record<TimePeriod, string> = {
    all: "All Time",
    month: "This Month",
    week: "This Week",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Leaderboard</h1>

      {/* Time period filter */}
      <div className="mb-6 flex gap-2">
        {(["all", "month", "week"] as TimePeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted-foreground">No data for this time period.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Solved</th>
                <th className="px-4 py-3 font-semibold">Active Days</th>
                <th className="px-4 py-3 font-semibold">Completion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isCurrentUser = user?.id === row.user_id;
                return (
                  <tr
                    key={row.user_id}
                    className={`border-b last:border-0 ${
                      isCurrentUser ? "bg-primary/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono">
                        {row.user_id.slice(0, 8)}…
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(you)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.solved}</td>
                    <td className="px-4 py-3">{row.active_days}</td>
                    <td className="px-4 py-3">{row.completion}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
