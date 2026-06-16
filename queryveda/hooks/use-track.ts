"use client";

import { useState, useEffect, useCallback } from "react";
import { trackStorage } from "@/lib/track-storage";
import { useAuth } from "./use-auth";
import type { Track } from "@/lib/track-types";

export function useTrack() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>(() => trackStorage.getTracks());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      trackStorage
        .syncTracksFromCloud(user.id)
        .then((cloudTracks) => {
          if (cloudTracks) setTracks(cloudTracks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setTracks(trackStorage.getTracks());
      setLoading(false);
    }
  }, [user]);

  const selectTracks = useCallback(
    (newTracks: Track[]) => {
      trackStorage.setTracks(newTracks);
      setTracks(newTracks);
      if (user) {
        trackStorage.syncTracksToCloud(user.id, newTracks);
      }
    },
    [user]
  );

  const hasTrack = useCallback(
    (track: Track) => tracks.includes(track),
    [tracks]
  );

  const needsOnboarding = !loading && tracks.length === 0;

  return { tracks, selectTracks, hasTrack, needsOnboarding, loading };
}
