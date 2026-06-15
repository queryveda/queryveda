"use client";

import { useState } from "react";
import Link from "next/link";
import { X, BookOpen } from "lucide-react";
import { skillTreeNodes } from "@/lib/skill-tree-data";
import type { Question } from "@/lib/types";

interface StruggleBannerProps {
  question: Question;
  failCount: number;
}

export function StruggleBanner({ question, failCount }: StruggleBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || failCount < 3) return null;

  const topicToNodeMap: Record<string, string> = {
    "Window Functions": "window-functions",
    "Aggregations & JOINs": "joins",
    "Cumulative & Sliding Windows": "cumulative-sliding",
    "Consecutive Sequences": "consecutive-sequences",
    "Advanced Analytics": "advanced-analytics",
  };

  const nodeId = topicToNodeMap[question.topic];
  const node = nodeId ? skillTreeNodes.find((n) => n.id === nodeId) : null;
  const fallbackNode = skillTreeNodes.find(
    (n) => n.id === "select-basics" || n.id === "where-filtering"
  );
  const targetNode = node ?? fallbackNode;
  if (!targetNode) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm">
      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
      <span className="flex-1 text-blue-700 dark:text-blue-400">
        Struggling? Review the{" "}
        <Link
          href={`/learn/${targetNode.id}`}
          className="font-medium underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-300"
        >
          {targetNode.title}
        </Link>
        {" "}exercises to strengthen your foundations.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="text-blue-500/60 hover:text-blue-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
