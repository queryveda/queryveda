"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface UserNotesProps {
  questionId: number;
}

export function UserNotes({ questionId }: UserNotesProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(() => storage.getNote(questionId));
  const [saved, setSaved] = useState(false);

  // Sync from cloud on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_notes")
      .select("note")
      .eq("user_id", user.id)
      .eq("question_id", questionId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.note) {
          storage.saveNote(questionId, data.note);
          setNote(data.note);
        }
      });
  }, [user, questionId]);

  const handleSave = () => {
    storage.saveNote(questionId, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    if (user) {
      const trimmed = note.trim();
      if (trimmed) {
        supabase.from("user_notes").upsert(
          {
            user_id: user.id,
            question_id: questionId,
            note: trimmed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,question_id" }
        );
      } else {
        supabase
          .from("user_notes")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", questionId);
      }
    }
  };

  const hasNote = note.trim().length > 0;

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
