"use client";
import { useState, useMemo } from "react";
import type { Difficulty, Topic, Question } from "@/lib/types";
import { DIFFICULTY_ORDER } from "@/lib/constants";
import { storage } from "@/lib/storage";

export function useFilters(questions: Question[]) {
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [search, setSearch] = useState("");
  const [bookmarkOnly, setBookmarkOnly] = useState(false);
  const [bookmarkFirst, setBookmarkFirst] = useState(false);

  const filtered = useMemo(() => {
    let result = questions;
    if (difficulty !== "All") result = result.filter((q) => q.difficulty === difficulty);
    if (topic !== "All") result = result.filter((q) => q.topic === topic);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((q) => q.title.toLowerCase().includes(s));
    }
    if (bookmarkOnly) {
      result = result.filter((q) => storage.isBookmarked(q.id));
    }
    return result.sort((a, b) => {
      if (bookmarkFirst) {
        const aB = storage.isBookmarked(a.id) ? 0 : 1;
        const bB = storage.isBookmarked(b.id) ? 0 : 1;
        if (aB !== bB) return aB - bB;
      }
      const di = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
      if (di !== 0) return di;
      return a.id - b.id;
    });
  }, [questions, difficulty, topic, search, bookmarkOnly, bookmarkFirst]);

  return {
    difficulty, setDifficulty,
    topic, setTopic,
    search, setSearch,
    bookmarkOnly, setBookmarkOnly,
    bookmarkFirst, setBookmarkFirst,
    filtered,
  };
}
