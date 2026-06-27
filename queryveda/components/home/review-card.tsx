"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDueReviews, type ReviewEntry } from "@/lib/review";
import { getQuestionById } from "@/lib/questions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_COLORS } from "@/lib/constants";
import type { Question } from "@/lib/types";

const BUCKET_LABELS: Record<ReviewEntry["bucket"], string> = {
  hard: "Hard",
  medium: "Medium",
  easy: "Easy",
};

const BUCKET_COLORS: Record<ReviewEntry["bucket"], string> = {
  hard: "#ef4444",
  medium: "#f59e0b",
  easy: "#22c55e",
};

export function ReviewCard() {
  const { user } = useAuth();
  const [dueItems, setDueItems] = useState<Array<{ review: ReviewEntry; question: Question }>>([]);

  useEffect(() => {
    if (!user) return;
    const reviews = getDueReviews();
    const items: Array<{ review: ReviewEntry; question: Question }> = [];
    for (const review of reviews) {
      const q = getQuestionById(review.questionId);
      if (q) items.push({ review, question: q });
      if (items.length >= 3) break;
    }
    setDueItems(items);
  }, [user]);

  if (!user || dueItems.length === 0) return null;

  const totalDue = getDueReviews().length;

  return (
    <section className="mx-auto max-w-5xl px-6 py-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <h3 className="text-base font-semibold">Due for Review</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalDue} problem{totalDue !== 1 ? "s" : ""} need{totalDue === 1 ? "s" : ""} review
          </span>
        </div>

        <div className="space-y-2">
          {dueItems.map(({ review, question }) => (
            <div
              key={question.id}
              className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">{question.title}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{
                    backgroundColor: BUCKET_COLORS[review.bucket] + "1a",
                    color: BUCKET_COLORS[review.bucket],
                  }}
                >
                  {BUCKET_LABELS[review.bucket]}
                </span>
              </div>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2"
                style={{
                  backgroundColor: DIFFICULTY_COLORS[question.difficulty] + "1a",
                  color: DIFFICULTY_COLORS[question.difficulty],
                }}
              >
                {question.topic}
              </span>
            </div>
          ))}
        </div>

        <Link href={`/practice/${dueItems[0].question.id}/`}>
          <Button size="sm" className="rounded-full">
            Start Review &rarr;
          </Button>
        </Link>
      </div>
    </section>
  );
}
