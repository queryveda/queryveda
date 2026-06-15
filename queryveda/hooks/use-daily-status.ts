"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { getDailyState, fetchDailyQuestion, todayIST } from "@/lib/daily";

export function useDailyStatus() {
  const { user } = useAuth();
  const [hasUnattempted, setHasUnattempted] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasUnattempted(false);
      return;
    }

    fetchDailyQuestion().then((dq) => {
      if (!dq || dq.date !== todayIST()) {
        setHasUnattempted(false);
        return;
      }
      const state = getDailyState();
      setHasUnattempted(!state.startedAt && !state.solved);
    });
  }, [user]);

  return { hasUnattempted };
}
