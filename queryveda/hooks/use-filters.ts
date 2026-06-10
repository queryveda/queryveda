"use client";
import { useState, useMemo } from "react";
import type { Difficulty, Topic, Question } from "@/lib/types";
import { DIFFICULTY_ORDER } from "@/lib/constants";

export function useFilters(questions: Question[]) {
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = questions;
    if (difficulty !== "All") result = result.filter((q) => q.difficulty === difficulty);
    if (topic !== "All") result = result.filter((q) => q.topic === topic);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((q) => q.title.toLowerCase().includes(s));
    }
    return result.sort((a, b) => {
      const di = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
      if (di !== 0) return di;
      return a.id - b.id;
    });
  }, [questions, difficulty, topic, search]);

  return { difficulty, setDifficulty, topic, setTopic, search, setSearch, filtered };
}
