import type { Track } from "./track-types";
import { ACTIVE_TRACKS } from "./track-types";
import { supabase } from "./supabase";

const STORAGE_KEY = "queryveda-tracks";

export const trackStorage = {
  getTracks(): Track[] {
    if (typeof window === "undefined") return ["sql"];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Track[];
      return parsed.filter((t) => ACTIVE_TRACKS.includes(t));
    } catch {
      return [];
    }
  },

  setTracks(tracks: Track[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  },

  hasSelectedTracks(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  async syncTracksToCloud(userId: string, tracks: Track[]) {
    await supabase.from("user_tracks").upsert(
      { user_id: userId, tracks },
      { onConflict: "user_id" }
    );
  },

  async syncTracksFromCloud(userId: string): Promise<Track[] | null> {
    const { data } = await supabase
      .from("user_tracks")
      .select("tracks")
      .eq("user_id", userId)
      .single();
    if (data?.tracks) {
      const tracks = data.tracks as Track[];
      trackStorage.setTracks(tracks);
      return tracks;
    }
    return null;
  },
};
