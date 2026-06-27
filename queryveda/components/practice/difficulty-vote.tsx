"use client";

import { useState } from "react";

type Vote = "easy" | "medium" | "hard" | null;

const VOTE_KEY = "sql_vote_";

function getVote(id: number): Vote {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(VOTE_KEY + id) as Vote) || null;
}

function setVote(id: number, vote: Vote): void {
  if (typeof window === "undefined") return;
  if (vote) localStorage.setItem(VOTE_KEY + id, vote);
  else localStorage.removeItem(VOTE_KEY + id);
}

const OPTIONS: { value: Vote; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  { value: "hard", label: "Hard", color: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" },
];

interface DifficultyVoteProps {
  questionId: number;
}

export function DifficultyVote({ questionId }: DifficultyVoteProps) {
  const [vote, setCurrentVote] = useState<Vote>(() => getVote(questionId));

  const handleVote = (v: Vote) => {
    const next = vote === v ? null : v;
    setVote(questionId, next);
    setCurrentVote(next);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground mr-1">Difficulty?</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleVote(opt.value)}
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
            vote === opt.value ? opt.color : "bg-muted/50 hover:bg-muted border-transparent"
          }`}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
