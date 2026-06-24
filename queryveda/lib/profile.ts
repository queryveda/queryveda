import { supabase } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import { TOPICS } from "@/lib/constants";
import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
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
  excelStats: ExcelProfileStats;
}

export interface ExcelNodeProgress {
  nodeId: string;
  title: string;
  completed: number;
  total: number;
}

export interface ExcelProfileStats {
  totalCompleted: number;
  totalItems: number;
  starredCount: number;
  nodeMasteries: ExcelNodeProgress[];
  achievements: Achievement[];
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

// --- Excel stats from Supabase ---

async function computeExcelStats(userId: string): Promise<ExcelProfileStats> {
  const { data } = await supabase
    .from("skill_tree_progress")
    .select("exercise_id, completed")
    .eq("user_id", userId)
    .eq("track", "excel");

  const completedIds = new Set(
    (data || []).filter((r) => r.completed).map((r) => r.exercise_id as string)
  );

  const nodeMasteries: ExcelNodeProgress[] = excelSkillTreeNodes.map((node) => {
    const conceptualCompleted = node.conceptualQuestions.filter((q) => completedIds.has(q.id)).length;
    const exercisesCompleted = node.exercises.filter((e) => completedIds.has(e.id)).length;
    const completed = conceptualCompleted + exercisesCompleted;
    const total = node.conceptualQuestions.length + node.exercises.length;
    return { nodeId: node.id, title: node.title, completed, total };
  });

  const totalCompleted = nodeMasteries.reduce((s, m) => s + m.completed, 0);
  const totalItems = nodeMasteries.reduce((s, m) => s + m.total, 0);
  const starredCount = nodeMasteries.filter((m) => m.total > 0 && m.completed === m.total).length;

  const conceptualCompleted = excelSkillTreeNodes.reduce(
    (s, node) => s + node.conceptualQuestions.filter((q) => completedIds.has(q.id)).length,
    0
  );

  const cellRefNode = nodeMasteries.find((m) => m.nodeId === "cell-references");
  const cellRefStarred = cellRefNode ? cellRefNode.total > 0 && cellRefNode.completed === cellRefNode.total : false;

  const achievements: Achievement[] = [
    { id: "excel-first-formula", name: "First Formula", desc: "Complete your first Excel exercise", icon: "📊", unlocked: totalCompleted >= 1 },
    { id: "excel-warmup-king", name: "Warmup King", desc: "Answer 10 conceptual questions", icon: "🧩", unlocked: conceptualCompleted >= 10 },
    { id: "excel-cell-master", name: "Cell Master", desc: "Star the Cell References node", icon: "📍", unlocked: cellRefStarred },
    { id: "excel-halfway", name: "Spreadsheet Student", desc: "Complete 50% of all Excel content", icon: "📈", unlocked: totalItems > 0 && totalCompleted >= totalItems / 2 },
    { id: "excel-3-stars", name: "Triple Star", desc: "Star 3 Excel skill nodes", icon: "⭐", unlocked: starredCount >= 3 },
    { id: "excel-all-stars", name: "Excel Grandmaster", desc: "Star all Excel skill nodes", icon: "👑", unlocked: starredCount >= excelSkillTreeNodes.length },
  ];

  return { totalCompleted, totalItems, starredCount, nodeMasteries, achievements };
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

  const excelStats = await computeExcelStats(userId);

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
    excelStats,
  };
}
