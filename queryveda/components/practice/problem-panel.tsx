"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ResultTable } from "./result-table";
import type { Question } from "@/lib/types";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";
import type { QueryResult } from "@/lib/pglite";
import { Lightbulb, BookOpen, Trophy, Sparkles } from "lucide-react";

const TIPS = [
  { icon: Lightbulb, label: "Query Plans", text: "Use the Plan tab to see how your SQL executes under the hood", color: "text-yellow-500" },
  { icon: BookOpen, label: "Learn SQL", text: "Master SQL concepts step by step with our guided skill tree", color: "text-blue-400", href: "/learn" },
  { icon: Trophy, label: "Leaderboard", text: "See how you rank against other learners on the platform", color: "text-amber-500", href: "/leaderboard" },
  { icon: Sparkles, label: "Excel Track", text: "Try our Excel formula challenges — cell references to advanced analytics", color: "text-emerald-400", href: "/excel" },
];

interface ProblemPanelProps {
  question: Question;
  schemaTables: Record<string, QueryResult>;
}

export function ProblemPanel({ question, schemaTables }: ProblemPanelProps) {
  // Pick 2 random tips based on question id for variety
  const tipIndices = [question.id % TIPS.length, (question.id + 2) % TIPS.length];
  const selectedTips = tipIndices.map((i) => TIPS[i]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          style={{ backgroundColor: DIFFICULTY_COLORS[question.difficulty] }}
          className="text-white"
        >
          {question.difficulty}
        </Badge>
        <Badge
          style={{ backgroundColor: TOPIC_COLORS[question.topic] }}
          className="text-white"
        >
          {question.topic}
        </Badge>
      </div>

      <p className="text-sm whitespace-pre-wrap">{question.desc}</p>

      {question.note && (
        <p className="text-sm text-muted-foreground italic">
          Note: {question.note}
        </p>
      )}

      {/* Schema tables */}
      {Object.entries(schemaTables).map(([tableName, result]) => (
        <div key={tableName}>
          <h4 className="text-sm font-semibold mb-1">{tableName}</h4>
          <ResultTable cols={result.cols} rows={result.rows} />
        </div>
      ))}

      {/* Expected output */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Expected Output</h4>
        <ResultTable cols={question.cols} rows={question.rows} />
      </div>

      {/* Ad slot — platform features for now, replaceable with real ads later */}
      <div className="mt-6 pt-4 border-t border-border/50" data-slot="sidebar-ad">
        <div className="flex flex-col gap-3">
          {selectedTips.map((tip, i) => {
            const Icon = tip.icon;
            const inner = (
              <div
                className={`flex items-start gap-3 rounded-xl p-3.5 border border-border/50 bg-gradient-to-br from-muted/50 to-muted/20 ${
                  tip.href ? "hover:border-primary/30 hover:from-primary/5 hover:to-transparent transition-all cursor-pointer" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${tip.color}`} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground/90">
                    {tip.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    {tip.text}
                  </span>
                </div>
              </div>
            );
            return tip.href ? (
              <Link key={i} href={tip.href}>{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
