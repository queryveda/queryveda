import { supabase } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import { TOPICS } from "@/lib/constants";
import type { Topic, Achievement } from "@/lib/types";

// --- Types ---

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileStats {
  totalSolved: number;
  completionPercent: number;
  streak: number;
  activeDays: number;
  byDifficulty: {
    Easy: { total: number; solved: number };
    Medium: { total: number; solved: number };
    Hard: { total: number; solved: number };
  };
  byTopic: { topic: Topic; total: number; solved: number }[];
  achievements: Achievement[];
  memberSince: string | null;
}

// --- Anonymous name generation (extracted from leaderboard) ---

const ADJECTIVES = [
  "Swift", "Clever", "Bold", "Quiet", "Bright", "Cosmic", "Lucky", "Nimble",
  "Witty", "Calm", "Daring", "Epic", "Fierce", "Grand", "Happy", "Jolly",
  "Keen", "Lively", "Mighty", "Noble", "Plucky", "Radiant", "Savvy", "Vivid",
  "Zesty", "Agile", "Brave", "Crisp", "Eager", "Fresh", "Gentle", "Hardy",
];
const ANIMALS = [
  "Falcon", "Panda", "Otter", "Fox", "Eagle", "Wolf", "Dolphin", "Lynx",
  "Hawk", "Bear", "Cobra", "Raven", "Tiger", "Owl", "Heron", "Bison",
  "Crane", "Deer", "Gecko", "Koala", "Moose", "Parrot", "Quail", "Seal",
  "Turtle", "Viper", "Whale", "Yak", "Zebra", "Lemur", "Marten", "Newt",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getAnonymousName(userId: string): string {
  const h = hashCode(userId);
  const adj = ADJECTIVES[h % ADJECTIVES.length];
  const animal = ANIMALS[(h >> 8) % ANIMALS.length];
  const num = (h % 100).toString().padStart(2, "0");
  return `${adj}${animal}${num}`;
}

// --- Profile CRUD ---

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as UserProfile | null;
}

export async function getProfileByToken(
  token: string
): Promise<{ profile: UserProfile; stats: ProfileStats } | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("share_token", token)
    .single();
  if (!data) return null;
  const profile = data as UserProfile;
  const stats = await computeProfileStats(profile.user_id);
  return { profile, stats };
}

export async function upsertDisplayName(userId: string, displayName: string): Promise<void> {
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      display_name: displayName.trim().slice(0, 30) || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function generateShareToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      share_token: token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return token;
}

export async function revokeShareToken(userId: string): Promise<void> {
  await supabase
    .from("user_profiles")
    .update({ share_token: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// --- Stats computation from Supabase ---

export async function computeProfileStats(userId: string): Promise<ProfileStats> {
  const { data } = await supabase
    .from("user_progress")
    .select("question_id, status, solved_at")
    .eq("user_id", userId);

  const rows = data || [];
  const solvedIds = new Set(rows.filter((r) => r.status === "solved").map((r) => r.question_id));
  const solvedDates = rows
    .filter((r) => r.status === "solved" && r.solved_at)
    .map((r) => r.solved_at!.slice(0, 10));
  const uniqueDates = Array.from(new Set(solvedDates)).sort().reverse();

  const totalSolved = solvedIds.size;
  const totalQuestions = questions.length;
  const completionPercent = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  // Streak
  let streak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
        if (diffDays === 1) streak++;
        else break;
      }
    }
  }

  // By difficulty
  const countByDiff = (d: string) => {
    const subset = questions.filter((q) => q.difficulty === d);
    return { total: subset.length, solved: subset.filter((q) => solvedIds.has(q.id)).length };
  };

  // By topic
  const byTopic = TOPICS.map((topic) => {
    const subset = questions.filter((q) => q.topic === topic);
    return { topic, total: subset.length, solved: subset.filter((q) => solvedIds.has(q.id)).length };
  });

  // Achievements (same 13 rules as storage.ts)
  const easySolved = countByDiff("Easy").solved;
  const medSolved = countByDiff("Medium").solved;
  const hardSolved = countByDiff("Hard").solved;
  const topicCount = (t: Topic) => byTopic.find((b) => b.topic === t)?.solved ?? 0;

  const achievements: Achievement[] = [
    { id: "first-steps", name: "First Steps", desc: "Solve your first problem", icon: "🎯", unlocked: totalSolved >= 1 },
    { id: "easy-street", name: "Easy Street", desc: "Solve all 25 Easy problems", icon: "🟢", unlocked: easySolved >= 25 },
    { id: "medium-mastery", name: "Medium Mastery", desc: "Solve all 25 Medium problems", icon: "🟡", unlocked: medSolved >= 25 },
    { id: "hard-hitter", name: "Hard Hitter", desc: "Solve 10 Hard problems", icon: "💪", unlocked: hardSolved >= 10 },
    { id: "unstoppable", name: "Unstoppable", desc: "Solve all 25 Hard problems", icon: "🔴", unlocked: hardSolved >= 25 },
    { id: "halfway", name: "Halfway There", desc: "Solve 50% of all problems", icon: "⭐", unlocked: totalSolved >= 38 },
    { id: "perfectionist", name: "Perfectionist", desc: "Solve all 75 problems", icon: "👑", unlocked: totalSolved >= 75 },
    { id: "join-guru", name: "JOIN Guru", desc: "Complete all Aggregations & JOINs", icon: "🔗", unlocked: topicCount("Aggregations & JOINs") >= 15 },
    { id: "window-master", name: "Window Master", desc: "Complete all Window Functions", icon: "🪟", unlocked: topicCount("Window Functions") >= 15 },
    { id: "cumulative-pro", name: "Cumulative Pro", desc: "Complete all Cumulative & Sliding Windows", icon: "📈", unlocked: topicCount("Cumulative & Sliding Windows") >= 15 },
    { id: "sequence-detective", name: "Sequence Detective", desc: "Complete all Consecutive Sequences", icon: "🔍", unlocked: topicCount("Consecutive Sequences") >= 15 },
    { id: "analytics-ace", name: "Analytics Ace", desc: "Complete all Advanced Analytics", icon: "🧠", unlocked: topicCount("Advanced Analytics") >= 15 },
    { id: "streak-7", name: "Week Warrior", desc: "Solve problems on 7 different days", icon: "🔥", unlocked: uniqueDates.length >= 7 },
  ];

  const memberSince = solvedDates.length > 0
    ? [...solvedDates].sort()[0]
    : null;

  return {
    totalSolved,
    completionPercent,
    streak,
    activeDays: uniqueDates.length,
    byDifficulty: {
      Easy: countByDiff("Easy"),
      Medium: countByDiff("Medium"),
      Hard: countByDiff("Hard"),
    },
    byTopic,
    achievements,
    memberSince,
  };
}
