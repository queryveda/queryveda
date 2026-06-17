"use client";

import { useCallback, useState, useEffect } from "react";
import { excelSkillTreeStorage } from "@/lib/excel-skill-tree-storage";
import { useAuth } from "./use-auth";
import type { ExcelNodeMastery } from "@/lib/excel-skill-tree-types";

export function useExcelSkillTree() {
  const { user } = useAuth();
  const [masteries, setMasteries] = useState<ExcelNodeMastery[]>([]);

  const refresh = useCallback(() => {
    const all = excelSkillTreeStorage.getAllNodeMasteries();
    if (user) {
      setMasteries(all);
    } else {
      // Logged out: preserve unlock state but hide progress
      setMasteries(all.map((m) => ({
        ...m,
        conceptualCompleted: 0,
        exercisesCompleted: 0,
        percentage: 0,
        starred: false,
        conceptualDone: false,
      })));
    }
  }, [user]);

  // Populate from localStorage on mount (client-only), then sync with cloud
  useEffect(() => {
    if (user) {
      excelSkillTreeStorage
        .syncSkillTreeFromCloud(user.id)
        .then(() => excelSkillTreeStorage.syncSkillTreeToCloud(user.id))
        .then(refresh);
    } else {
      refresh();
    }
  }, [user, refresh]);

  const markExerciseCompleted = useCallback(
    (exerciseId: string) => {
      excelSkillTreeStorage.markExerciseCompleted(exerciseId, user?.id);
      refresh();
    },
    [user, refresh]
  );

  const markConceptualCompleted = useCallback(
    (questionId: string) => {
      excelSkillTreeStorage.markConceptualCompleted(questionId, user?.id);
      refresh();
    },
    [user, refresh]
  );

  const isExerciseCompleted = useCallback(
    (exerciseId: string) => excelSkillTreeStorage.isExerciseCompleted(exerciseId),
    []
  );

  const isConceptualCompleted = useCallback(
    (questionId: string) => excelSkillTreeStorage.isConceptualCompleted(questionId),
    []
  );

  const getNodeMastery = useCallback(
    (nodeId: string) =>
      masteries.find((m) => m.nodeId === nodeId) ?? {
        nodeId,
        conceptualCompleted: 0,
        conceptualTotal: 0,
        exercisesCompleted: 0,
        exercisesTotal: 0,
        percentage: 0,
        unlocked: false,
        starred: false,
        conceptualDone: false,
      },
    [masteries]
  );

  return {
    masteries,
    markExerciseCompleted,
    markConceptualCompleted,
    isExerciseCompleted,
    isConceptualCompleted,
    getNodeMastery,
    refresh,
  };
}
