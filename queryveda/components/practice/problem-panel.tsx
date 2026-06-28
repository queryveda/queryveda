"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ResultTable } from "./result-table";
import type { Question } from "@/lib/types";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";
import type { QueryResult } from "@/lib/pglite";

const ADS = [
  { text: "Master SQL with guided skill trees", emoji: "🎯", href: "/learn" },
  { text: "Try our Excel formula challenges", emoji: "📊", href: "/excel" },
  { text: "Climb the leaderboard — compete with others", emoji: "🏆", href: "/leaderboard" },
  { text: "75+ SQL problems from Easy to Hard", emoji: "🔥", href: "/practice" },
  { text: "See query execution plans in real time", emoji: "⚡" },
  { text: "Track your progress across all topics", emoji: "📈", href: "/learn" },
  { text: "Free forever — no signup required to practice", emoji: "🎉" },
  { text: "Built-in PostgreSQL — runs entirely in your browser", emoji: "🚀" },
];

interface ProblemPanelProps {
  question: Question;
  schemaTables: Record<string, QueryResult>;
}

export function ProblemPanel({ question, schemaTables }: ProblemPanelProps) {
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

      {/* Scrolling marquee ad banner — like cricket boundary LED boards */}
      <div className="mt-6" data-slot="sidebar-ad">
        <div className="overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="marquee-track flex items-center gap-8 whitespace-nowrap py-3 px-4">
            {/* Duplicate content for seamless loop */}
            {[...ADS, ...ADS].map((ad, i) => {
              const content = (
                <span className="inline-flex items-center gap-2 text-sm">
                  <span>{ad.emoji}</span>
                  <span className={`font-medium ${ad.href ? "text-primary" : "text-foreground/80"}`}>
                    {ad.text}
                  </span>
                  <span className="text-muted-foreground/30 mx-2">|</span>
                </span>
              );
              return ad.href ? (
                <Link key={i} href={ad.href} className="hover:opacity-80 transition-opacity shrink-0">
                  {content}
                </Link>
              ) : (
                <span key={i} className="shrink-0">{content}</span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
