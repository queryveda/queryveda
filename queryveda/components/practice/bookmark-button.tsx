"use client";

import { useState } from "react";
import { storage } from "@/lib/storage";

interface BookmarkButtonProps {
  questionId: number;
}

export function BookmarkButton({ questionId }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(() =>
    storage.isBookmarked(questionId)
  );

  const handleToggle = () => {
    const next = storage.toggleBookmark(questionId);
    setBookmarked(next);
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
