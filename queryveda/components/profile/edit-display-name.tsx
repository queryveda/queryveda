"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { upsertDisplayName } from "@/lib/profile";

interface EditDisplayNameProps {
  userId: string;
  currentName: string | null;
  onSave: (name: string) => void;
}

export function EditDisplayName({ userId, currentName, onSave }: EditDisplayNameProps) {
  const [name, setName] = useState(currentName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertDisplayName(userId, name);
      const trimmed = name.trim().slice(0, 30);
      setName(trimmed);
      onSave(trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium shrink-0">Display Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        placeholder="Anonymous"
        disabled={saving}
        className="rounded-lg border bg-background px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button onClick={handleSave} disabled={saving} size="sm" variant="outline" className="rounded-full">
        {saved ? "Saved!" : saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
