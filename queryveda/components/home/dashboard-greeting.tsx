"use client";

import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { getSortedQuestions } from "@/lib/questions";

export function DashboardGreeting() {
  const { user } = useAuth();
  const questions = getSortedQuestions();
  const solved = storage.countSolved(questions);
  const streak = storage.getCurrentStreak();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-baseline justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {streak > 0 && <>{streak}-day streak &middot; </>}
          {solved} problem{solved !== 1 ? "s" : ""} solved
        </p>
      </div>
      <span className="text-sm text-muted-foreground hidden sm:block">{today}</span>
    </div>
  );
}
