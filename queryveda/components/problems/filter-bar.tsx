"use client";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

export function FilterBar({
  difficulty, topic, onDifficultyChange, onTopicChange,
  bookmarkOnly, onBookmarkOnlyChange,
  bookmarkFirst, onBookmarkFirstChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Difficulty dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="sm" variant="outline" className="rounded-full gap-2" />
          }
        >
          {difficulty !== "All" && <Dot color={DIFFICULTY_COLORS[difficulty]} />}
          <span>{difficulty === "All" ? "Difficulty" : difficulty}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="!w-auto min-w-[11rem]">
          <DropdownMenuRadioGroup
            value={difficulty}
            onValueChange={(v) => onDifficultyChange(v as Difficulty | "All")}
          >
            <DropdownMenuRadioItem value="All">All difficulties</DropdownMenuRadioItem>
            {DIFFICULTIES.map((d) => (
              <DropdownMenuRadioItem key={d} value={d} className="gap-2">
                <Dot color={DIFFICULTY_COLORS[d]} />
                {d}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Topic dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-2 max-w-[15rem]"
            />
          }
        >
          {topic !== "All" && <Dot color={TOPIC_COLORS[topic]} />}
          <span className="truncate">{topic === "All" ? "Topic" : topic}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="!w-auto min-w-[16rem]">
          <DropdownMenuRadioGroup
            value={topic}
            onValueChange={(v) => onTopicChange(v as Topic | "All")}
          >
            <DropdownMenuRadioItem value="All">All topics</DropdownMenuRadioItem>
            {TOPICS.map((t) => (
              <DropdownMenuRadioItem key={t} value={t} className="gap-2 whitespace-nowrap">
                <Dot color={TOPIC_COLORS[t]} />
                {t}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
