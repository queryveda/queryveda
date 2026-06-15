"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Target } from "lucide-react";

export function TwoPathCards() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Learn SQL Card */}
        <Link href="/learn" className="group">
          <div className="rounded-2xl p-[1px] transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10"
            style={{ background: "var(--qv-gradient-card)" }}
          >
            <div className="rounded-2xl bg-card p-6 h-full flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Learn SQL</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Step-by-step skill tree with interactive micro-exercises. Build knowledge from the ground up.
              </p>
              {/* Mini skill tree preview */}
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm shadow-primary/20">
                  &#x2713;
                </span>
                <span className="w-6 h-[2px] bg-primary/30 rounded-full" />
                <span className="w-8 h-8 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                  2
                </span>
                <span className="w-6 h-[2px] bg-muted-foreground/20 rounded-full" />
                <span className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center text-xs text-muted-foreground/60">
                  &#x1F512;
                </span>
                <span className="w-6 h-[2px] bg-muted-foreground/10 rounded-full" />
                <span className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/15 flex items-center justify-center text-xs text-muted-foreground/40">
                  &#x1F512;
                </span>
              </div>
              <Button className="w-full mt-auto">Start Learning</Button>
            </div>
          </div>
        </Link>

        {/* Practice Problems Card */}
        <Link href="/problems" className="group">
          <div className="rounded-2xl p-[1px] transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10"
            style={{ background: "var(--qv-gradient-card)" }}
          >
            <div className="rounded-2xl bg-card p-6 h-full flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Practice Problems</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                75 curated challenges across 5 topics. Test your skills from easy to hard.
              </p>
              {/* Difficulty badges */}
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-medium border border-emerald-500/15">
                  Easy
                </span>
                <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-medium border border-amber-500/15">
                  Medium
                </span>
                <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 text-xs font-medium border border-red-500/15">
                  Hard
                </span>
              </div>
              <Button className="w-full mt-auto">Start Practicing</Button>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
