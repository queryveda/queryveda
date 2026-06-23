import { supabase } from "./supabase";
import { excelSkillTreeNodes } from "./excel-skill-tree-data";
import type { ExcelNodeMastery } from "./excel-skill-tree-types";

const PROGRESS_KEY = "queryveda-excel-progress";
const CONCEPTUAL_KEY = "queryveda-excel-conceptual";

interface ProgressMap {
  [exerciseId: string]: { completed: boolean; completedAt?: string };
}

function getProgressMap(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getConceptualMap(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CONCEPTUAL_KEY) || "{}");
  } catch {
    return {};
  }
}

export const excelSkillTreeStorage = {
  markExerciseCompleted(exerciseId: string, userId?: string) {
    const map = getProgressMap();
    map[exerciseId] = { completed: true, completedAt: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));

    if (userId) {
      const node = excelSkillTreeNodes.find((n) =>
        n.exercises.some((e) => e.id === exerciseId) ||
        n.bonusExercises?.some((e) => e.id === exerciseId)
      );
      if (node) {
        supabase.from("skill_tree_progress").upsert(
          {
            user_id: userId,
            node_id: node.id,
            exercise_id: exerciseId,
            completed: true,
            completed_at: new Date().toISOString(),
            track: "excel",
          },
          { onConflict: "user_id,node_id,exercise_id" }
        );
      }
    }
  },

  markConceptualCompleted(questionId: string, userId?: string) {
    const map = getConceptualMap();
    map[questionId] = { completed: true, completedAt: new Date().toISOString() };
    localStorage.setItem(CONCEPTUAL_KEY, JSON.stringify(map));

    if (userId) {
      const node = excelSkillTreeNodes.find((n) =>
        n.conceptualQuestions.some((q) => q.id === questionId) ||
        n.bonusConceptualQuestions?.some((q) => q.id === questionId)
      );
      if (node) {
        supabase.from("skill_tree_progress").upsert(
          {
            user_id: userId,
            node_id: node.id,
            exercise_id: questionId,
            completed: true,
            completed_at: new Date().toISOString(),
            track: "excel",
          },
          { onConflict: "user_id,node_id,exercise_id" }
        );
      }
    }
  },

  isExerciseCompleted(exerciseId: string): boolean {
    return getProgressMap()[exerciseId]?.completed ?? false;
  },

  isConceptualCompleted(questionId: string): boolean {
    return getConceptualMap()[questionId]?.completed ?? false;
  },

  getAllNodeMasteries(): ExcelNodeMastery[] {
    const progress = getProgressMap();
    const conceptual = getConceptualMap();

    return excelSkillTreeNodes.map((node) => {
      const conceptualCompleted = node.conceptualQuestions.filter(
        (q) => conceptual[q.id]?.completed
      ).length;
      const conceptualTotal = node.conceptualQuestions.length;
      const exercisesCompleted = node.exercises.filter(
        (e) => progress[e.id]?.completed
      ).length;
      const exercisesTotal = node.exercises.length;
      // Bonus items excluded from core percentage
      const bonusConceptualCompleted = (node.bonusConceptualQuestions ?? []).filter(
        (q) => conceptual[q.id]?.completed
      ).length;
      const bonusConceptualTotal = (node.bonusConceptualQuestions ?? []).length;
      const bonusExercisesCompleted = (node.bonusExercises ?? []).filter(
        (e) => progress[e.id]?.completed
      ).length;
      const bonusExercisesTotal = (node.bonusExercises ?? []).length;

      const total = conceptualTotal + exercisesTotal;
      const completed = conceptualCompleted + exercisesCompleted;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const conceptualDone = conceptualCompleted >= conceptualTotal;
      const allExercisesDone = exercisesCompleted >= exercisesTotal;

      const unlocked =
        node.prerequisites.length === 0 ||
        node.prerequisites.every((preId) => {
          const preNode = excelSkillTreeNodes.find((n) => n.id === preId);
          if (!preNode) return false;
          const preTotal = preNode.conceptualQuestions.length + preNode.exercises.length;
          const preCompleted =
            preNode.conceptualQuestions.filter((q) => conceptual[q.id]?.completed).length +
            preNode.exercises.filter((e) => progress[e.id]?.completed).length;
          return preTotal > 0 && (preCompleted / preTotal) * 100 >= 60;
        });

      return {
        nodeId: node.id,
        conceptualCompleted,
        conceptualTotal,
        exercisesCompleted,
        exercisesTotal,
        percentage,
        unlocked,
        starred: percentage === 100,
        conceptualDone,
        bonusConceptualCompleted,
        bonusConceptualTotal,
        bonusExercisesCompleted,
        bonusExercisesTotal,
        allExercisesDone,
      };
    });
  },

  async syncSkillTreeFromCloud(userId: string) {
    const { data } = await supabase
      .from("skill_tree_progress")
      .select("node_id, exercise_id, completed, completed_at")
      .eq("user_id", userId)
      .eq("track", "excel");

    if (!data) return;

    const progress = getProgressMap();
    const conceptual = getConceptualMap();

    for (const row of data) {
      if (!row.completed) continue;
      const isConceptual = excelSkillTreeNodes.some((n) =>
        n.conceptualQuestions.some((q) => q.id === row.exercise_id) ||
        n.bonusConceptualQuestions?.some((q) => q.id === row.exercise_id)
      );
      const map = isConceptual ? conceptual : progress;
      if (!map[row.exercise_id]?.completed) {
        map[row.exercise_id] = {
          completed: true,
          completedAt: row.completed_at ?? undefined,
        };
      }
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    localStorage.setItem(CONCEPTUAL_KEY, JSON.stringify(conceptual));
  },

  async syncSkillTreeToCloud(userId: string) {
    const progress = getProgressMap();
    const conceptual = getConceptualMap();
    const allMaps = { ...progress, ...conceptual };
    const upserts: {
      user_id: string;
      node_id: string;
      exercise_id: string;
      completed: boolean;
      completed_at: string | null;
      track: string;
    }[] = [];

    for (const [exId, val] of Object.entries(allMaps)) {
      if (!val.completed) continue;
      const node = excelSkillTreeNodes.find(
        (n) =>
          n.exercises.some((e) => e.id === exId) ||
          n.bonusExercises?.some((e) => e.id === exId) ||
          n.conceptualQuestions.some((q) => q.id === exId) ||
          n.bonusConceptualQuestions?.some((q) => q.id === exId)
      );
      if (!node) continue;
      upserts.push({
        user_id: userId,
        node_id: node.id,
        exercise_id: exId,
        completed: true,
        completed_at: val.completedAt ?? null,
        track: "excel",
      });
    }

    if (upserts.length > 0) {
      await supabase
        .from("skill_tree_progress")
        .upsert(upserts, { onConflict: "user_id,node_id,exercise_id" });
    }
  },
};
