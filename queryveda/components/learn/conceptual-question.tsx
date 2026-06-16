"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { ConceptualQuestion as ConceptualQuestionType } from "@/lib/excel-skill-tree-types";

interface ConceptualQuestionProps {
  question: ConceptualQuestionType;
  onCorrect: () => void;
  alreadyCompleted?: boolean;
}

export function ConceptualQuestion({ question, onCorrect, alreadyCompleted }: ConceptualQuestionProps) {
  const [selected, setSelected] = useState<string>("");
  const [submitted, setSubmitted] = useState(alreadyCompleted ?? false);
  const [correct, setCorrect] = useState(alreadyCompleted ?? false);

  const handleSubmit = () => {
    const trimmed = selected.trim();
    if (!trimmed) return;
    const isCorrect = trimmed.toLowerCase() === question.correctAnswer.toLowerCase();
    setCorrect(isCorrect);
    setSubmitted(true);
    if (isCorrect) onCorrect();
  };

  if (question.type === "multiple-choice") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <p className="font-medium">{question.question}</p>
        <div className="space-y-2">
          {question.options!.map((opt) => {
            const isSelected = selected === opt;
            const showResult = submitted;
            const isCorrectOption = opt === question.correctAnswer;

            let borderClass = "border-border hover:border-primary/40";
            if (showResult && isCorrectOption) borderClass = "border-emerald-500 bg-emerald-500/5";
            else if (showResult && isSelected && !isCorrectOption) borderClass = "border-red-500 bg-red-500/5";
            else if (isSelected) borderClass = "border-primary bg-primary/5";

            return (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => setSelected(opt)}
                className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${borderClass}`}
              >
                <div className="flex items-center gap-2">
                  {showResult && isCorrectOption && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {showResult && isSelected && !isCorrectOption && <X className="w-4 h-4 text-red-500 shrink-0" />}
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {!submitted && (
          <Button onClick={handleSubmit} disabled={!selected} size="sm">
            Check Answer
          </Button>
        )}
        {submitted && (
          <div className={`rounded-lg p-3 text-sm ${correct ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}>
            {correct ? "Correct! " : "Not quite. "}
            {question.explanation}
          </div>
        )}
      </div>
    );
  }

  // fill-blank type
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <p className="font-medium">{question.question}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer..."
          className="rounded-lg border bg-background px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {!submitted && (
          <Button onClick={handleSubmit} disabled={!selected.trim()} size="sm">
            Check
          </Button>
        )}
      </div>
      {submitted && (
        <div className={`rounded-lg p-3 text-sm ${correct ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}>
          {correct ? "Correct! " : `The answer is "${question.correctAnswer}". `}
          {question.explanation}
        </div>
      )}
    </div>
  );
}
