"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_KEY = "queryveda-tour-completed";

export function useTourState() {
  const [completed, setCompleted] = useState(true); // default true to avoid flash

  useEffect(() => {
    setCompleted(localStorage.getItem(TOUR_KEY) === "true");
  }, []);

  const markCompleted = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setCompleted(true);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setCompleted(false);
  }, []);

  return { completed, markCompleted, reset };
}
