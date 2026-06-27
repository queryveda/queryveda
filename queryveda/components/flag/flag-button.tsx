"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "solution_error", label: "Solution Error" },
  { value: "question_error", label: "Question Error" },
  { value: "data_error", label: "Data Error" },
  { value: "table_error", label: "Table Error" },
  { value: "other", label: "Other" },
] as const;

type FlagCategory = (typeof CATEGORIES)[number]["value"];

interface FlagButtonProps {
  questionId: number;
  questionSource: "practice" | "daily";
}

export function FlagButton({ questionId, questionSource }: FlagButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FlagCategory | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !category) return;
    setSubmitting(true);
    try {
      await supabase.from("flagged_questions").upsert(
        {
          user_id: user.id,
          question_id: questionId,
          question_source: questionSource,
          category,
          message: message.trim() || null,
        },
        { onConflict: "user_id,question_id,category" }
      );
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setCategory(null);
        setMessage("");
      }, 1500);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-lg opacity-60 hover:opacity-100 transition-opacity"
        title="Report an issue"
        type="button"
      >
        🤔
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border bg-background shadow-lg p-4 space-y-3">
            {submitted ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium text-center py-2">
                Thanks for the feedback!
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold">What&apos;s wrong with this question?</p>

                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        category === cat.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 hover:bg-muted border-transparent"
                      }`}
                      type="button"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue (optional)"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!category || submitting}
                  size="sm"
                  className="w-full rounded-full"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
