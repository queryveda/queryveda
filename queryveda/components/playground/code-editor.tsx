"use client";

import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
  lineNumbers,
} from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { python } from "@codemirror/lang-python";
import {
  defaultKeymap,
  historyKeymap,
  indentWithTab,
  history,
} from "@codemirror/commands";
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  acceptCompletion,
} from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  language: "sql" | "python";
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  tables?: Record<string, string[]>;
}

export function CodeEditor({
  language,
  value,
  onChange,
  onRun,
  tables,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const { resolvedTheme } = useTheme();
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isDark = resolvedTheme === "dark";

  const langExt = (): Extension =>
    language === "python"
      ? python()
      : sql({ dialect: PostgreSQL, schema: tables, upperCaseKeywords: true });

  useEffect(() => {
    if (!containerRef.current) return;
    const extensions: Extension[] = [
      langCompartment.current.of(langExt()),
      autocompletion(),
      closeBrackets(),
      history(),
      lineNumbers(),
      placeholderExt(
        language === "python"
          ? "Write PySpark code… end with a DataFrame"
          : "Write SQL…"
      ),
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRunRef.current();
            return true;
          },
        },
        { key: "Tab", run: acceptCompletion },
        ...closeBracketsKeymap,
        ...historyKeymap,
        indentWithTab,
        ...defaultKeymap,
      ]),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChangeRef.current(u.state.doc.toString());
      }),
      EditorView.theme({
        "&": { height: "260px", fontFamily: "var(--font-mono)" },
        ".cm-scroller": { overflow: "auto" },
      }),
      isDark
        ? oneDark
        : syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    ];
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, language]);

  // Reconfigure SQL autocomplete schema without rebuilding the editor.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: langCompartment.current.reconfigure(langExt()),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  // Push external value changes (session restore, language switch) into the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur !== value)
      view.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [value]);

  return (
    <div
      className="rounded-xl border border-primary/20 overflow-hidden"
      ref={containerRef}
    />
  );
}
