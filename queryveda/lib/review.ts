import { supabase } from "@/lib/supabase";

export interface ReviewEntry {
  questionId: number;
  bucket: "easy" | "medium" | "hard";
  lastReviewedAt: string; // ISO date
  nextReviewAt: string;   // ISO date
  reviewCount: number;
}

const INTERVALS: Record<ReviewEntry["bucket"], number[]> = {
  easy: [7, 14, 30, 60],
  medium: [3, 7, 14, 30],
  hard: [1, 3, 7, 14],
};

const STORAGE_KEY = "review_schedule";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// localStorage read/write helpers
function loadEntries(): ReviewEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: ReviewEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Determine difficulty bucket based on performance
export function determineBucket(
  attemptCount: number,
  elapsedMs: number
): ReviewEntry["bucket"] {
  const elapsedMin = elapsedMs / 60_000;
  if (attemptCount <= 1 && elapsedMin < 3) return "easy";
  if (attemptCount <= 3 || elapsedMin < 10) return "medium";
  return "hard";
}

// Get all review entries
export function getReviewEntries(): ReviewEntry[] {
  return loadEntries();
}

// Get a specific review entry by question ID
export function getReviewEntry(questionId: number): ReviewEntry | undefined {
  return loadEntries().find((e) => e.questionId === questionId);
}

// Get reviews that are due today or overdue
export function getDueReviews(): ReviewEntry[] {
  const today = todayISO();
  return loadEntries()
    .filter((e) => e.nextReviewAt <= today)
    .sort((a, b) => {
      // Overdue first, then hard > medium > easy
      const bucketOrder = { hard: 0, medium: 1, easy: 2 };
      const dateComp = a.nextReviewAt.localeCompare(b.nextReviewAt);
      if (dateComp !== 0) return dateComp;
      return bucketOrder[a.bucket] - bucketOrder[b.bucket];
    });
}

// Add a new review entry for a question that was just solved
export function addReviewEntry(questionId: number, bucket: ReviewEntry["bucket"]) {
  const entries = loadEntries();
  const existing = entries.find((e) => e.questionId === questionId);
  if (existing) return; // already tracked

  const today = todayISO();
  const interval = INTERVALS[bucket][0];
  const entry: ReviewEntry = {
    questionId,
    bucket,
    lastReviewedAt: today,
    nextReviewAt: addDays(today, interval),
    reviewCount: 0,
  };
  entries.push(entry);
  saveEntries(entries);
  syncReviewToCloud(entry);
}

// Update review entry after a review session
export function updateReviewAfterSolve(questionId: number, firstTry: boolean) {
  const entries = loadEntries();
  const entry = entries.find((e) => e.questionId === questionId);
  if (!entry) return;

  const today = todayISO();
  entry.lastReviewedAt = today;

  if (firstTry) {
    // Advance to next interval
    entry.reviewCount++;
    const intervals = INTERVALS[entry.bucket];
    const idx = Math.min(entry.reviewCount, intervals.length - 1);
    entry.nextReviewAt = addDays(today, intervals[idx]);
  } else {
    // Reset to first interval
    entry.reviewCount = 0;
    entry.nextReviewAt = addDays(today, INTERVALS[entry.bucket][0]);
  }

  saveEntries(entries);
  syncReviewToCloud(entry);
}

// Sync a single review entry to Supabase
async function syncReviewToCloud(entry: ReviewEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("review_schedule").upsert(
      {
        user_id: user.id,
        question_id: entry.questionId,
        bucket: entry.bucket,
        last_reviewed_at: entry.lastReviewedAt,
        next_review_at: entry.nextReviewAt,
        review_count: entry.reviewCount,
      },
      { onConflict: "user_id,question_id" }
    );
  } catch {
    // silent — localStorage is the fallback
  }
}

// Sync all review entries from Supabase to localStorage
export async function syncReviewFromCloud() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("review_schedule")
      .select("*")
      .eq("user_id", user.id);
    if (!data || data.length === 0) return;

    const local = loadEntries();
    for (const row of data) {
      const idx = local.findIndex((e) => e.questionId === row.question_id);
      const cloudEntry: ReviewEntry = {
        questionId: row.question_id,
        bucket: row.bucket,
        lastReviewedAt: row.last_reviewed_at,
        nextReviewAt: row.next_review_at,
        reviewCount: row.review_count,
      };
      if (idx >= 0) {
        // Latest wins
        if (row.last_reviewed_at > local[idx].lastReviewedAt) {
          local[idx] = cloudEntry;
        }
      } else {
        local.push(cloudEntry);
      }
    }
    saveEntries(local);
  } catch {
    // silent
  }
}
