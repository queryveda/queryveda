"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrack } from "@/hooks/use-track";
import { Button } from "@/components/ui/button";
import { BookOpen, Table2, Check } from "lucide-react";
import type { Track } from "@/lib/track-types";

const trackOptions: { id: Track; label: string; description: string; icon: typeof BookOpen }[] = [
  {
    id: "sql",
    label: "SQL",
    description: "Write queries against a real PostgreSQL database in your browser",
    icon: BookOpen,
  },
  {
    id: "excel",
    label: "Excel",
    description: "Master formulas and analytics in an interactive spreadsheet",
    icon: Table2,
  },
];

export function OnboardingClient() {
  const router = useRouter();
  const { selectTracks } = useTrack();
  const [selected, setSelected] = useState<Set<Track>>(new Set());

  const toggle = (track: Track) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });
  };

  const handleContinue = () => {
    const tracks = Array.from(selected);
    if (tracks.length === 0) return;
    selectTracks(tracks);
    router.push("/");
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        What do you want to learn?
      </h1>
      <p className="mt-3 text-muted-foreground text-lg">
        Select one or both. You can change this anytime.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-2xl w-full">
        {trackOptions.map(({ id, label, description, icon: Icon }) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`relative rounded-2xl p-6 text-left transition-all border-2 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <Icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold">{label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        className="mt-8"
        disabled={selected.size === 0}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}
