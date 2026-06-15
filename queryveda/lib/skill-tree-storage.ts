import { supabase } from "@/lib/supabase";
import { skillTreeNodes } from "./skill-tree-data";
import type { SkillTreeProgress, NodeMastery } from "./skill-tree-types";

const STORAGE_KEY = "qv_skill_tree";

// --- localStorage ---

function _load(): SkillTreeProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function _save(data: SkillTreeProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isExerciseCompleted(exerciseId: string): boolean {
  return _load()[exerciseId]?.completed === true;
}

function markExerciseCompleted(exerciseId: string, userId?: string): void {
  const data = _load();
  if (data[exerciseId]?.completed) return;
  data[exerciseId] = { completed: true, completedAt: new Date().toISOString() };
  _save(data);
  if (userId) {
    const node = skillTreeNodes.find((n) =>
      n.exercises.some((e) => e.id === exerciseId)
    );
    if (node) {
      _saveToCloud(userId, node.id, exerciseId);
    }
  }
}

function getNodeMastery(nodeId: string): { completed: number; total: number } {
  const node = skillTreeNodes.find((n) => n.id === nodeId);
  if (!node) return { completed: 0, total: 0 };
  const data = _load();
  const completed = node.exercises.filter(
    (e) => data[e.id]?.completed
  ).length;
  return { completed, total: node.exercises.length };
}

function getNodeMasteryPercentage(nodeId: string): number {
  const { completed, total } = getNodeMastery(nodeId);
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function isNodeUnlocked(nodeId: string): boolean {
  const node = skillTreeNodes.find((n) => n.id === nodeId);
  if (!node) return false;
  if (node.prerequisites.length === 0) return true;
  return node.prerequisites.every(
    (prereqId) => getNodeMasteryPercentage(prereqId) >= 60
  );
}

function getAllNodeMasteries(): NodeMastery[] {
  return skillTreeNodes.map((node) => {
    const { completed, total } = getNodeMastery(node.id);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      nodeId: node.id,
      completed,
      total,
      percentage,
      unlocked: isNodeUnlocked(node.id),
      starred: percentage === 100,
    };
  });
}

// --- Supabase sync ---

async function _saveToCloud(
  userId: string,
  nodeId: string,
  exerciseId: string
): Promise<void> {
  try {
    await supabase.from("skill_tree_progress").upsert(
      {
        user_id: userId,
        node_id: nodeId,
        exercise_id: exerciseId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,node_id,exercise_id" }
    );
  } catch {
    // best-effort cloud save
  }
}

async function syncSkillTreeFromCloud(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from("skill_tree_progress")
      .select("exercise_id, completed, completed_at")
      .eq("user_id", userId)
      .eq("completed", true);
    if (!data) return;
    const local = _load();
    for (const row of data) {
      if (!local[row.exercise_id]?.completed) {
        local[row.exercise_id] = {
          completed: true,
          completedAt: row.completed_at,
        };
      }
    }
    _save(local);
  } catch {
    // best-effort sync
  }
}

async function syncSkillTreeToCloud(userId: string): Promise<void> {
  const data = _load();
  const entries = Object.entries(data).filter(([, v]) => v.completed);
  for (const [exerciseId] of entries) {
    const node = skillTreeNodes.find((n) =>
      n.exercises.some((e) => e.id === exerciseId)
    );
    if (node) {
      await _saveToCloud(userId, node.id, exerciseId);
    }
  }
}

export const skillTreeStorage = {
  isExerciseCompleted,
  markExerciseCompleted,
  getNodeMastery,
  getNodeMasteryPercentage,
  isNodeUnlocked,
  getAllNodeMasteries,
  syncSkillTreeFromCloud,
  syncSkillTreeToCloud,
};
