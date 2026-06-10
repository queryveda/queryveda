"use client";

import { TOPIC_COLORS, DIFFICULTY_COLORS } from "@/lib/constants";
import type { Topic } from "@/lib/types";

interface DifficultyStats {
  Easy: { total: number; solved: number };
  Medium: { total: number; solved: number };
  Hard: { total: number; solved: number };
}

interface TopicStats {
  topic: Topic;
  total: number;
  solved: number;
}

interface ProgressBarsProps {
  byDifficulty: DifficultyStats;
  byTopic: TopicStats[];
}

function Bar({ label, solved, total, color }: { label: string; solved: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{solved}/{total}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ProgressBars({ byDifficulty, byTopic }: ProgressBarsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-4 font-semibold">By Difficulty</h3>
        <Bar
          label="Easy"
          solved={byDifficulty.Easy.solved}
          total={byDifficulty.Easy.total}
          color={DIFFICULTY_COLORS.Easy}
        />
        <Bar
          label="Medium"
          solved={byDifficulty.Medium.solved}
          total={byDifficulty.Medium.total}
          color={DIFFICULTY_COLORS.Medium}
        />
        <Bar
          label="Hard"
          solved={byDifficulty.Hard.solved}
          total={byDifficulty.Hard.total}
          color={DIFFICULTY_COLORS.Hard}
        />
      </div>
      <div>
        <h3 className="mb-4 font-semibold">By Topic</h3>
        {byTopic.map(({ topic, solved, total }) => (
          <Bar
            key={topic}
            label={topic}
            solved={solved}
            total={total}
            color={TOPIC_COLORS[topic]}
          />
        ))}
      </div>
    </div>
  );
}
