"use client";

import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion } from "@codemirror/autocomplete";
import { useTheme } from "next-themes";

interface SQLEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  onRun: () => void;
  tables?: Record<string, string[]>;
}

export function SQLEditor({
  initialValue,
  onChange,
  onRun,
  tables,
}: SQLEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      sql({ dialect: PostgreSQL, schema: tables }),
      autocompletion(),
      placeholderExt("Write your SQL here..."),
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRun();
            return true;
          },
        },
        indentWithTab,
        ...defaultKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        "&": { height: "220px", fontFamily: "var(--font-mono)" },
        ".cm-scroller": { overflow: "auto" },
      }),
    ];

    if (resolvedTheme === "dark") {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: initialValue,
      extensions,
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate editor on theme change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  // Update doc when initialValue changes (question navigation)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== initialValue) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: initialValue },
      });
    }
  }, [initialValue]);

  return (
    <div className="rounded-md border overflow-hidden" ref={containerRef} />
  );
}
