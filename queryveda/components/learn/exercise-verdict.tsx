"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface ExerciseVerdictProps {
  type: "idle" | "pass" | "fail";
  message: string;
}

export function ExerciseVerdict({ type, message }: ExerciseVerdictProps) {
  if (type === "idle") return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
        type === "pass"
          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
      }`}
    >
      {type === "pass" ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
