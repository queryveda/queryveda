"use client";

import { useState } from "react";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface UserNotesProps {
  questionId: number;
}

export function UserNotes({ questionId }: UserNotesProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(() => storage.getNote(questionId));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    storage.saveNote(questionId, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const hasNote = storage.getNote(questionId).trim().length > 0;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`text-xl transition-all ${
          hasNote
            ? "opacity-100 scale-110"
            : "opacity-60 hover:opacity-100 hover:scale-110"
        }`}
        title={open ? "Close notes" : "Your notes"}
        type="button"
      >
        {hasNote ? "📝" : "🗒️"}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border bg-background p-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your notes for this problem..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} size="sm" className="rounded-full">
              {saved ? "Saved!" : "Save Note"}
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
