"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTourState } from "@/hooks/use-tour-state";

const tourSteps = [
  {
    element: "[data-tour='learn']",
    popover: {
      title: "Learn",
      description: "Choose SQL or Excel learning tracks with structured lessons.",
    },
  },
  {
    element: "[data-tour='daily']",
    popover: {
      title: "Daily Challenge",
      description: "A new challenge every day — keep your streak going!",
    },
  },
  {
    element: "[data-tour='problems']",
    popover: {
      title: "Problems",
      description: "75+ practice problems sorted by difficulty.",
    },
  },
  {
    element: "[data-tour='progress']",
    popover: {
      title: "Progress",
      description: "Track your achievements, streaks, and mastery.",
    },
  },
  {
    element: "[data-tour='leaderboard']",
    popover: {
      title: "Leaderboard",
      description: "See how you rank against other learners.",
    },
  },
  {
    element: "[data-tour='theme-toggle']",
    popover: {
      title: "Theme",
      description: "Switch between dark and light mode.",
    },
  },
  {
    element: "[data-tour='learning-paths']",
    popover: {
      title: "Your Learning Path",
      description: "Unlock nodes as you progress through the skill tree.",
    },
  },
];

export function PlatformTour() {
  const { completed, markCompleted } = useTourState();
  const pathname = usePathname();
  const hasAutoStarted = useRef(false);

  const startTour = useCallback(() => {
    // Only include steps whose target element exists on the current page
    const activeSteps = tourSteps.filter(
      (step) => document.querySelector(step.element) !== null
    );
    if (activeSteps.length === 0) return;

    const d = driver({
      showProgress: true,
      steps: activeSteps,
      popoverClass: "qv-tour-popover",
      nextBtnText: "Next",
      prevBtnText: "Previous",
      doneBtnText: "Done",
      stagePadding: 0,
      stageRadius: 8,
      overlayOpacity: 0,
      onDestroyStarted: () => {
        markCompleted();
        d.destroy();
      },
    });
    d.drive();
  }, [markCompleted]);

  // Auto-start on first visit to home page
  useEffect(() => {
    if (!completed && pathname === "/" && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      const timer = setTimeout(startTour, 500);
      return () => clearTimeout(timer);
    }
  }, [completed, pathname, startTour]);

  // Listen for manual "Take a Tour" trigger
  useEffect(() => {
    const handler = () => startTour();
    window.addEventListener("queryveda:start-tour", handler);
    return () => window.removeEventListener("queryveda:start-tour", handler);
  }, [startTour]);

  return null;
}

// Export for navbar button to call
export { useTourState };
