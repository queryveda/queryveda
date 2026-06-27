"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { keys: ["⌘", "Enter"], desc: "Run query" },
  { keys: ["Ctrl", "Enter"], desc: "Run query (Windows/Linux)" },
  { keys: ["⌘", "/"], desc: "Show keyboard shortcuts" },
  { keys: ["Ctrl", "/"], desc: "Show keyboard shortcuts (Windows/Linux)" },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-xl border bg-background shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-muted border text-xs font-mono">⌘/Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted border text-xs font-mono">/</kbd> to toggle
        </p>
      </div>
    </>
  );
}
