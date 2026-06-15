"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Target } from "lucide-react";

export function TwoPathCards() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Learn SQL Card */}
        <Link href="/learn" className="group">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Learn SQL</CardTitle>
              </div>
              <CardDescription>
                Step-by-step skill tree with interactive micro-exercises
              </CardDescription>
              {/* Mini skill tree preview */}
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  &#x2713;
                </span>
                <span className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-xs font-bold text-primary">
                  2
                </span>
                <span className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                  &#x1F512;
                </span>
                <span className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                  &#x1F512;
                </span>
              </div>
              <Button className="w-full">Start Learning</Button>
            </CardHeader>
          </Card>
        </Link>

        {/* Practice Problems Card */}
        <Link href="/problems" className="group">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Practice Problems</CardTitle>
              </div>
              <CardDescription>
                75 curated challenges across 5 topics
              </CardDescription>
              {/* Difficulty badges */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-500/15 text-green-600 dark:text-green-400 px-2.5 py-0.5 text-xs font-medium">
                  Easy
                </span>
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs font-medium">
                  Medium
                </span>
                <span className="rounded-full bg-red-500/15 text-red-600 dark:text-red-400 px-2.5 py-0.5 text-xs font-medium">
                  Hard
                </span>
              </div>
              <Button className="w-full">Start Practicing</Button>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </section>
  );
}
