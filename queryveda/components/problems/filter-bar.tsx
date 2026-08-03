"use client";
import { Button } from "@/components/ui/button";
import type { Difficulty, Topic } from "@/lib/types";
import { TOPICS } from "@/lib/constants";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

interface FilterBarProps {
  difficulty: Difficulty | "All";
  topic: Topic | "All";
  onDifficultyChange: (d: Difficulty | "All") => void;
  onTopicChange: (t: Topic | "All") => void;
  bookmarkOnly?: boolean;
  onBookmarkOnlyChange?: (v: boolean) => void;
  bookmarkFirst?: boolean;
  onBookmarkFirstChange?: (v: boolean) => void;
}

const selectClass =
  "h-8 rounded-full border bg-background px-3 pr-8 text-[0.8rem] cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted";

export function FilterBar({
  difficulty, topic, onDifficultyChange, onTopicChange,
  bookmarkOnly, onBookmarkOnlyChange,
  bookmarkFirst, onBookmarkFirstChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Difficulty select */}
      <select
        aria-label="Filter by difficulty"
        value={difficulty}
        onChange={(e) => onDifficultyChange(e.target.value as Difficulty | "All")}
        className={selectClass}
      >
        <option value="All">All difficulties</option>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Topic select */}
      <select
        aria-label="Filter by topic"
        value={topic}
        onChange={(e) => onTopicChange(e.target.value as Topic | "All")}
        className={`${selectClass} max-w-[15rem]`}
      >
        <option value="All">All topics</option>
        {TOPICS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Bookmark toggles */}
      {onBookmarkOnlyChange && onBookmarkFirstChange && (
        <>
          <Button
            size="sm"
            variant={bookmarkOnly ? "default" : "outline"}
            onClick={() => onBookmarkOnlyChange(!bookmarkOnly)}
            className="shrink-0 rounded-full"
          >
            🔖 <span className="hidden sm:inline">Bookmarked</span> Only
          </Button>
          <Button
            size="sm"
            variant={bookmarkFirst ? "default" : "outline"}
            onClick={() => onBookmarkFirstChange(!bookmarkFirst)}
            className="shrink-0 rounded-full"
          >
            🔖 <span className="hidden sm:inline">Bookmarked</span> First
          </Button>
        </>
      )}
    </div>
  );
}
