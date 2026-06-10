"use client";

import { useCallback } from "react";
import { storage } from "@/lib/storage";
import { useAuth } from "./use-auth";
import type { QuestionStatus } from "@/lib/types";

export function useStorage() {
  const { user } = useAuth();
  const getStatus = useCallback((id: number): QuestionStatus => user ? storage.getStatus(id) : "todo", [user]);
  const markSolved = useCallback(
    (id: number) => storage.markSolved(id, user?.id),
    [user]
  );
  const markAttempted = useCallback(
    (id: number) => storage.markAttempted(id, user?.id),
    [user]
  );
  const getSavedSQL = useCallback((id: number): string => storage.getSavedSQL(id), []);
  const saveSQL = useCallback((id: number, sql: string) => storage.saveSQL(id, sql), []);
  return { getStatus, markSolved, markAttempted, getSavedSQL, saveSQL };
}
