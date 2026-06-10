"use client";

import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
  lineNumbers,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { autocompletion } from "@codemirror/autocomplete";
import { useTheme } from "next-themes";

// Custom light theme for the editor chrome
const lightEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#faf9f7",
      color: "#1c1917",
    },
    ".cm-content": {
      caretColor: "#2563eb",
    },
    ".cm-cursor": {
      borderLeftColor: "#2563eb",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#dbeafe",
    },
    ".cm-activeLine": {
      backgroundColor: "#f0ede8",
    },
    ".cm-gutters": {
      backgroundColor: "#f5f3f0",
      color: "#a8a29e",
      borderRight: "1px solid #e7e5e4",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#e7e5e4",
    },
  },
  { dark: false }
);

// Custom light syntax highlighting with vivid colors
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#7c3aed", fontWeight: "bold" },
  { tag: tags.operatorKeyword, color: "#7c3aed", fontWeight: "bold" },
  { tag: tags.definitionKeyword, color: "#7c3aed", fontWeight: "bold" },
  { tag: tags.typeName, color: "#0891b2" },
  { tag: tags.string, color: "#059669" },
  { tag: tags.number, color: "#d97706" },
  { tag: tags.bool, color: "#d97706" },
  { tag: tags.null, color: "#d97706", fontStyle: "italic" },
  { tag: tags.comment, color: "#a8a29e", fontStyle: "italic" },
  { tag: tags.variableName, color: "#1c1917" },
  { tag: tags.propertyName, color: "#2563eb" },
  { tag: tags.function(tags.variableName), color: "#2563eb" },
  { tag: tags.operator, color: "#78716c" },
  { tag: tags.punctuation, color: "#78716c" },
  { tag: tags.bracket, color: "#78716c" },
  { tag: tags.special(tags.string), color: "#059669" },
]);

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

    const isDark = resolvedTheme === "dark";

    const extensions = [
      sql({ dialect: PostgreSQL, schema: tables }),
      autocompletion(),
      lineNumbers(),
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

    if (isDark) {
      extensions.push(oneDark);
    } else {
      extensions.push(lightEditorTheme);
      extensions.push(syntaxHighlighting(lightHighlightStyle));
      extensions.push(syntaxHighlighting(defaultHighlightStyle, { fallback: true }));
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
    <div className="rounded-xl border overflow-hidden" ref={containerRef} />
  );
}
