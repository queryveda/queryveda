"use client";

import { useCallback, useState, useEffect } from "react";
import { skillTreeStorage } from "@/lib/skill-tree-storage";
import { useAuth } from "./use-auth";
import type { NodeMastery } from "@/lib/skill-tree-types";

export function useSkillTree() {
  const { user } = useAuth();
  // Initialize synchronously from localStorage to avoid flash of "Locked"
  const [masteries, setMasteries] = useState<NodeMastery[]>(
    () => skillTreeStorage.getAllNodeMasteries()
  );

  const refresh = useCallback(() => {
    setMasteries(skillTreeStorage.getAllNodeMasteries());
  }, []);

  useEffect(() => {
    if (user) {
      // Pull cloud → local, then push local → cloud (catches any unsynced local progress)
      skillTreeStorage.syncSkillTreeFromCloud(user.id)
        .then(() => skillTreeStorage.syncSkillTreeToCloud(user.id))
        .then(refresh);
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
