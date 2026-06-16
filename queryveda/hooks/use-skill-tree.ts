"use client";

import { useCallback, useState, useEffect } from "react";
import { skillTreeStorage } from "@/lib/skill-tree-storage";
import { useAuth } from "./use-auth";
import type { NodeMastery } from "@/lib/skill-tree-types";

export function useSkillTree() {
  const { user } = useAuth();
  const [masteries, setMasteries] = useState<NodeMastery[]>([]);

  const refresh = useCallback(() => {
    setMasteries(skillTreeStorage.getAllNodeMasteries());
  }, []);

  // Populate from localStorage on mount (client-only), then sync with cloud
  useEffect(() => {
    if (user) {
      skillTreeStorage.syncSkillTreeFromCloud(user.id)
        .then(() => skillTreeStorage.syncSkillTreeToCloud(user.id))
        .then(refresh);
    } else {
      refresh();
    }
  }, [user, refresh]);

  const markCompleted = useCallback(
    (exerciseId: string) => {
      skillTreeStorage.markExerciseCompleted(exerciseId, user?.id);
      refresh();
    },
    [user, refresh]
  );

  const isExerciseCompleted = useCallback(
    (exerciseId: string) => skillTreeStorage.isExerciseCompleted(exerciseId),
    []
  );

  const getNodeMastery = useCallback(
    (nodeId: string) =>
      masteries.find((m) => m.nodeId === nodeId) ?? {
        nodeId,
        completed: 0,
        total: 0,
        percentage: 0,
        unlocked: false,
        starred: false,
      },
    [masteries]
  );

  return { masteries, markCompleted, isExerciseCompleted, getNodeMastery, refresh };
}
