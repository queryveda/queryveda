import { supabase } from "@/lib/supabase";
import type { Question, QuestionStatus, Achievement, Difficulty, Topic } from "@/lib/types";

// --- Question progress ---

function isSolved(id: number): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sql_solved_" + id) === "1";
}

function isAttempted(id: number): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sql_attempted_" + id) === "1";
}

function getStatus(id: number): QuestionStatus {
  if (isSolved(id)) return "solved";
  if (isAttempted(id)) return "attempted";
  return "todo";
}

function _recordSolveDate(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const dates = getSolveDates();
  if (!dates.includes(today)) {
    dates.push(today);
    localStorage.setItem("sql_solve_dates", JSON.stringify(dates));
  }
}

function markSolved(id: number, userId?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("sql_solved_" + id, "1");
  localStorage.removeItem("sql_attempted_" + id);
  _recordSolveDate();
  if (userId) {
    _saveToCloud(userId, id, "solved");
  }
}

function markAttempted(id: number, userId?: string): void {
  if (typeof window === "undefined") return;
  if (isSolved(id)) return;
  localStorage.setItem("sql_attempted_" + id, "1");
  if (userId) {
    _saveToCloud(userId, id, "attempted");
  }
}

// --- Bookmarks ---

function isBookmarked(id: number): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sql_bookmark_" + id) === "1";
}

function setBookmark(id: number, value: boolean): void {
  if (typeof window === "undefined") return;
  const key = "sql_bookmark_" + id;
  if (value) localStorage.setItem(key, "1");
  else localStorage.removeItem(key);
}

function toggleBookmark(id: number): boolean {
  if (typeof window === "undefined") return false;
  const next = !isBookmarked(id);
  setBookmark(id, next);
  return next;
}

function getBookmarkedIds(): number[] {
  if (typeof window === "undefined") return [];
  const ids: number[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("sql_bookmark_") && localStorage.getItem(key) === "1") {
      ids.push(Number(key.replace("sql_bookmark_", "")));
    }
  }
  return ids.sort((a, b) => a - b);
}

// --- User notes ---

function getNote(id: number): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sql_note_" + id) || "";
}

function saveNote(id: number, note: string): void {
  if (typeof window === "undefined") return;
  const key = "sql_note_" + id;
  if (note.trim()) localStorage.setItem(key, note);
  else localStorage.removeItem(key);
}

// --- Editor content ---

function getSavedSQL(id: number): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sql_q_" + id) || "";
}

function saveSQL(id: number, sql: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("sql_q_" + id, sql);
}

// --- Solve dates (streak tracking) ---

function getSolveDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("sql_solve_dates") || "[]");
  } catch {
    return [];
  }
}

// --- Streak calculation ---

function getCurrentStreak(): number {
  const dates = getSolveDates().sort().reverse();
  if (!dates.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  // Streak must include today or yesterday to be "current"
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

// --- Aggregate stats ---

function countSolved(questions: Question[]): number {
  return questions.filter((q) => isSolved(q.id)).length;
}

function countByDifficulty(
  questions: Question[],
  difficulty: Difficulty
): { total: number; solved: number } {
  const subset = questions.filter((q) => q.difficulty === difficulty);
  return { total: subset.length, solved: countSolved(subset) };
}

function countByTopic(
  questions: Question[],
  topic: Topic
): { total: number; solved: number } {
  const subset = questions.filter((q) => q.topic === topic);
  return { total: subset.length, solved: countSolved(subset) };
}

// --- Achievements (13 definitions) ---

function getAchievements(questions: Question[]): Achievement[] {
  const totalSolved = countSolved(questions);
  const easySolved = countByDifficulty(questions, "Easy").solved;
  const medSolved = countByDifficulty(questions, "Medium").solved;
  const hardSolved = countByDifficulty(questions, "Hard").solved;
  const solveDays = getSolveDates().length;

  return [
    {
      id: "first-steps",
      name: "First Steps",
      desc: "Solve your first problem",
      icon: "🎯",
      unlocked: totalSolved >= 1,
    },
    {
      id: "easy-street",
      name: "Easy Street",
      desc: "Solve all 25 Easy problems",
      icon: "🟢",
      unlocked: easySolved >= 25,
    },
    {
      id: "medium-mastery",
      name: "Medium Mastery",
      desc: "Solve all 25 Medium problems",
      icon: "🟡",
      unlocked: medSolved >= 25,
    },
    {
      id: "hard-hitter",
      name: "Hard Hitter",
      desc: "Solve 10 Hard problems",
      icon: "💪",
      unlocked: hardSolved >= 10,
    },
    {
      id: "unstoppable",
      name: "Unstoppable",
      desc: "Solve all 25 Hard problems",
      icon: "🔴",
      unlocked: hardSolved >= 25,
    },
    {
      id: "halfway",
      name: "Halfway There",
      desc: "Solve 50% of all problems",
      icon: "⭐",
      unlocked: totalSolved >= 38,
    },
    {
      id: "perfectionist",
      name: "Perfectionist",
      desc: "Solve all 75 problems",
      icon: "👑",
      unlocked: totalSolved >= 75,
    },
    {
      id: "join-guru",
      name: "JOIN Guru",
      desc: "Complete all Aggregations & JOINs",
      icon: "🔗",
      unlocked: countByTopic(questions, "Aggregations & JOINs").solved >= 15,
    },
    {
      id: "window-master",
      name: "Window Master",
      desc: "Complete all Window Functions",
      icon: "🪟",
      unlocked: countByTopic(questions, "Window Functions").solved >= 15,
    },
    {
      id: "cumulative-pro",
      name: "Cumulative Pro",
      desc: "Complete all Cumulative & Sliding Windows",
      icon: "📈",
      unlocked: countByTopic(questions, "Cumulative & Sliding Windows").solved >= 15,
    },
    {
      id: "sequence-detective",
      name: "Sequence Detective",
      desc: "Complete all Consecutive Sequences",
      icon: "🔍",
      unlocked: countByTopic(questions, "Consecutive Sequences").solved >= 15,
    },
    {
      id: "analytics-ace",
      name: "Analytics Ace",
      desc: "Complete all Advanced Analytics",
      icon: "🧠",
      unlocked: countByTopic(questions, "Advanced Analytics").solved >= 15,
    },
    {
      id: "streak-7",
      name: "Week Warrior",
      desc: "Solve problems on 7 different days",
      icon: "🔥",
      unlocked: solveDays >= 7,
    },
  ];
}

// --- Cloud sync ---

async function _saveToCloud(
  userId: string,
  questionId: number,
  status: "solved" | "attempted"
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    question_id: questionId,
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "solved") row.solved_at = new Date().toISOString();
  await supabase
    .from("user_progress")
    .upsert(row, { onConflict: "user_id,question_id" });
}

async function syncFromCloud(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("user_progress")
      .select("question_id, status, solved_at")
      .eq("user_id", userId);
    for (const p of data || []) {
      if (p.status === "solved") {
        localStorage.setItem("sql_solved_" + p.question_id, "1");
        localStorage.removeItem("sql_attempted_" + p.question_id);
      } else if (p.status === "attempted" && !isSolved(p.question_id)) {
        localStorage.setItem("sql_attempted_" + p.question_id, "1");
      }
    }
  } catch (e) {
    console.warn("Cloud sync failed:", e);
  }
}

async function syncLocalToCloud(userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("user_progress")
    .select("question_id")
    .eq("user_id", userId);
  const cloudIds = new Set((existing || []).map((r: { question_id: number }) => r.question_id));

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i <= 75; i++) {
    if (cloudIds.has(i)) continue; // don't overwrite cloud data
    const solved = typeof window !== "undefined" && localStorage.getItem("sql_solved_" + i) === "1";
    const attempted = typeof window !== "undefined" && localStorage.getItem("sql_attempted_" + i) === "1";
    if (solved) {
      rows.push({
        user_id: userId,
        question_id: i,
        status: "solved",
        solved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else if (attempted) {
      rows.push({
        user_id: userId,
        question_id: i,
        status: "attempted",
        updated_at: new Date().toISOString(),
      });
    }
  }
  if (rows.length) {
    await supabase
      .from("user_progress")
      .upsert(rows, { onConflict: "user_id,question_id" });
  }
}

export const storage = {
  isSolved,
  isAttempted,
  getStatus,
  markSolved,
  markAttempted,
  getSavedSQL,
  saveSQL,
  getSolveDates,
  getCurrentStreak,
  countSolved,
  countByDifficulty,
  countByTopic,
  getAchievements,
  syncFromCloud,
  syncLocalToCloud,
  _saveToCloud,
  isBookmarked,
  setBookmark,
  toggleBookmark,
  getBookmarkedIds,
  getNote,
  saveNote,
};
