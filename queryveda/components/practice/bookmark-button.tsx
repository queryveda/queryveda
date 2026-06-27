"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { storage } from "@/lib/storage";

interface BookmarkButtonProps {
  questionId: number;
}

export function BookmarkButton({ questionId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(() =>
    storage.isBookmarked(questionId)
  );

  // Sync from cloud on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookmarks")
      .select("question_id")
      .eq("user_id", user.id)
      .eq("question_id", questionId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          storage.setBookmark(questionId, true);
          setBookmarked(true);
        }
      });
  }, [user, questionId]);

  const handleToggle = () => {
    const next = storage.toggleBookmark(questionId);
    setBookmarked(next);
    if (user) {
      if (next) {
        supabase
          .from("bookmarks")
          .upsert(
            { user_id: user.id, question_id: questionId },
            { onConflict: "user_id,question_id" }
          );
      } else {
        supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", questionId);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`text-xl transition-all ${
        bookmarked
          ? "opacity-100 scale-110"
          : "opacity-60 hover:opacity-100 hover:scale-110"
      }`}
      title={bookmarked ? "Remove bookmark" : "Bookmark this problem"}
      type="button"
    >
      {bookmarked ? "🔖" : "📑"}
    </button>
  );
}
