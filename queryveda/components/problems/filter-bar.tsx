"use client";
import { Button } from "@/components/ui/button";
import type { Difficulty, Topic } from "@/lib/types";
import { TOPICS, DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";

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

export function FilterBar({
  difficulty, topic, onDifficultyChange, onTopicChange,
  bookmarkOnly, onBookmarkOnlyChange,
  bookmarkFirst, onBookmarkFirstChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Difficulty row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          size="sm"
          variant={difficulty === "All" ? "default" : "outline"}
          onClick={() => onDifficultyChange("All")}
          className="shrink-0 rounded-full"
        >
          All
        </Button>
        {DIFFICULTIES.map((d) => (
          <Button
            key={d}
            size="sm"
            variant="outline"
            onClick={() => onDifficultyChange(d)}
            className="shrink-0 rounded-full border-transparent"
            style={
              difficulty === d
                ? { backgroundColor: DIFFICULTY_COLORS[d], color: "#fff", borderColor: DIFFICULTY_COLORS[d] }
                : { color: DIFFICULTY_COLORS[d], borderColor: DIFFICULTY_COLORS[d] }
            }
          >
            {d}
          </Button>
        ))}
      </div>

      {/* Topic row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          size="sm"
          variant={topic === "All" ? "default" : "outline"}
          onClick={() => onTopicChange("All")}
          className="shrink-0 rounded-full"
        >
          All Topics
        </Button>
        {TOPICS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant="outline"
            onClick={() => onTopicChange(t)}
            className="shrink-0 rounded-full"
            style={
              topic === t
                ? { backgroundColor: TOPIC_COLORS[t], color: "#fff", borderColor: TOPIC_COLORS[t] }
                : { borderColor: TOPIC_COLORS[t], color: TOPIC_COLORS[t] }
            }
          >
            {t}
          </Button>
        ))}
      </div>

      {/* Bookmark row */}
      {onBookmarkOnlyChange && onBookmarkFirstChange && (
        <div className="flex gap-2 pb-1">
          <Button
            size="sm"
            variant={bookmarkOnly ? "default" : "outline"}
            onClick={() => onBookmarkOnlyChange(!bookmarkOnly)}
            className="shrink-0 rounded-full"
          >
            🔖 Bookmarked Only
          </Button>
          <Button
            size="sm"
            variant={bookmarkFirst ? "default" : "outline"}
            onClick={() => onBookmarkFirstChange(!bookmarkFirst)}
            className="shrink-0 rounded-full"
          >
            🔖 Bookmarked First
          </Button>
        </div>
      )}
    </div>
  );
}
