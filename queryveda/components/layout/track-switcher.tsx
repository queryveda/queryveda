"use client";

import { useTrack } from "@/hooks/use-track";
import { TRACK_LABELS } from "@/lib/track-types";

export function TrackSwitcher() {
  const { tracks } = useTrack();

  if (tracks.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 text-sm">
      {tracks.map((track) => (
        <a
          key={track}
          href={track === "sql" ? "/learn" : `/${track}`}
          className="rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-background hover:text-foreground text-muted-foreground"
        >
          {TRACK_LABELS[track]}
        </a>
      ))}
    </div>
  );
}
