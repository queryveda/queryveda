import type { Question } from "./types";

/* Types */
export interface DailyQuestion {
  date: string; // "YYYY-MM-DD"
  question: Omit<Question, "id">;
}

export interface DailyChallengeState {
  date: string;
  startedAt: number | null; // timestamp ms
  duration: number | null; // minutes (15 | 30 | 45)
  solved: boolean;
  sql: string;
}

/* Fetch */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export async function fetchDailyQuestion(): Promise<DailyQuestion | null> {
  try {
    const res = await fetch(`${BASE}/daily-question.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: DailyQuestion = await res.json();
    return data;
  } catch {
    return null;
  }
}

/* Today helper (IST = UTC+5:30) */
export function todayIST(): string {
  const now = new Date();
  const istMs = now.getTime() + (330 + now.getTimezoneOffset()) * 60_000;
  const ist = new Date(istMs);
  return ist.toISOString().slice(0, 10);
}

/* localStorage state */
const STORAGE_KEY = "daily_challenge";

function getState(): DailyChallengeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as DailyChallengeState;
      if (s.date === todayIST()) return s;
    }
  } catch {
    // ignore
  }
  return { date: todayIST(), startedAt: null, duration: null, solved: false, sql: "" };
}

function setState(s: DailyChallengeState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getDailyState() {
  return getState();
}

export function startChallenge(duration: number) {
  const s = getState();
  if (!s.startedAt) {
    s.startedAt = Date.now();
    s.duration = duration;
    setState(s);
  }
  return s;
}

export function saveDailySQL(sql: string) {
  const s = getState();
  s.sql = sql;
  setState(s);
}

export function markDailySolved() {
  const s = getState();
  s.solved = true;
  setState(s);
}

/* Timer math */
export function msUntilNextRefresh(): number {
  const now = new Date();
  const istMs = now.getTime() + (330 + now.getTimezoneOffset()) * 60_000;
  const ist = new Date(istMs);
  const target = new Date(ist);
  target.setHours(9, 0, 0, 0);
  if (ist >= target) {
    target.setDate(target.getDate() + 1);
  }
  const targetUTC = target.getTime() - (330 + now.getTimezoneOffset()) * 60_000;
  return Math.max(0, targetUTC - now.getTime());
}

export function solveTimerRemaining(state: DailyChallengeState): number {
  if (!state.startedAt || !state.duration) return 0;
  const elapsed = Date.now() - state.startedAt;
  const total = state.duration * 60_000;
  return Math.max(0, total - elapsed);
}

export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
