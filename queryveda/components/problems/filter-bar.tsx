"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

interface Option {
  value: string;
  label: string;
  color?: string;
}

/**
 * Lightweight controlled dropdown. Clicking the currently-selected (non-"All")
 * option toggles the filter off (back to `allValue`) so the user can clear a
 * topic/difficulty by clicking it again.
 */
function FilterSelect({
  placeholder,
  value,
  allValue,
  allLabel,
  options,
  onChange,
  menuClassName,
}: {
  placeholder: string;
  value: string;
  allValue: string;
  allLabel: string;
  options: Option[];
  onChange: (v: string) => void;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const isAll = value === allValue;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2 rounded-full max-w-[15rem]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {!isAll && selected?.color && <Dot color={selected.color} />}
        <span className="truncate">{isAll ? placeholder : selected?.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </Button>
      {open && (
        <div
          className={cn(
            "absolute left-0 z-50 mt-1 max-h-[60vh] min-w-[14rem] overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
            menuClassName
          )}
        >
          <button
            type="button"
            onClick={() => {
              onChange(allValue);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <span className="flex-1">{allLabel}</span>
            {isAll && <Check className="h-4 w-4 shrink-0" />}
          </button>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  // Clicking the already-selected option clears it (shows all).
                  onChange(active ? allValue : o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  active && "font-medium"
                )}
              >
                {o.color && <Dot color={o.color} />}
                <span className="flex-1 whitespace-nowrap">{o.label}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  difficulty, topic, onDifficultyChange, onTopicChange,
  bookmarkOnly, onBookmarkOnlyChange,
  bookmarkFirst, onBookmarkFirstChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        placeholder="Difficulty"
        allLabel="All difficulties"
        allValue="All"
        value={difficulty}
        onChange={(v) => onDifficultyChange(v as Difficulty | "All")}
        options={DIFFICULTIES.map((d) => ({ value: d, label: d, color: DIFFICULTY_COLORS[d] }))}
      />

      <FilterSelect
        placeholder="Topic"
        allLabel="All topics"
        allValue="All"
        value={topic}
        onChange={(v) => onTopicChange(v as Topic | "All")}
        options={TOPICS.map((t) => ({ value: t, label: t, color: TOPIC_COLORS[t] }))}
        menuClassName="min-w-[16rem]"
      />

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
