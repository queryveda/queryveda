"use client";

import { Card } from "@/components/ui/card";
import type { Achievement } from "@/lib/types";

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  return (
    <div>
      <h3 className="mb-4 font-semibold">Achievements</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a) => (
          <Card
            key={a.id}
            className={`flex flex-col items-center gap-1 p-4 text-center transition-opacity ${
              a.unlocked ? "opacity-100" : "opacity-40"
            }`}
          >
            <span className="text-3xl">{a.icon}</span>
            <span className="text-sm font-semibold">{a.name}</span>
            <span className="text-xs text-muted-foreground">{a.desc}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
