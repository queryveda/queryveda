"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
  lineNumbers,
} from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { history } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { autocompletion, acceptCompletion } from "@codemirror/autocomplete";
import {
  dracula,
  solarizedLight,
  cobalt,
  coolGlow,
  espresso,
  noctisLilac,
  ayuLight,
} from "thememirror";
import { useTheme } from "next-themes";

// Custom warm light theme matching the site
const warmLightTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#f8f6fc", color: "#181424" },
    ".cm-content": { caretColor: "#7C3AED" },
    ".cm-cursor": { borderLeftColor: "#7C3AED" },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#e4d8f5",
    },
    ".cm-activeLine": { backgroundColor: "#f4f0fa" },
    ".cm-gutters": {
      backgroundColor: "#f2eef8",
      color: "#9890a8",
      borderRight: "1px solid #e4def0",
    },
    ".cm-activeLineGutter": { backgroundColor: "#ece6f5" },
  },
  { dark: false }
);

const warmLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#7c3aed", fontWeight: "bold" },
  { tag: tags.operatorKeyword, color: "#7c3aed", fontWeight: "bold" },
  { tag: tags.definitionKeyword, color: "#7c3aed", fontWeight: "bold" },
  { tag: tags.typeName, color: "#0891b2" },
  { tag: tags.string, color: "#059669" },
  { tag: tags.number, color: "#d97706" },
  { tag: tags.bool, color: "#d97706" },
  { tag: tags.null, color: "#d97706", fontStyle: "italic" },
  { tag: tags.comment, color: "#a8a29e", fontStyle: "italic" },
  { tag: tags.variableName, color: "#181424" },
  { tag: tags.propertyName, color: "#7C3AED" },
  { tag: tags.function(tags.variableName), color: "#7C3AED" },
  { tag: tags.operator, color: "#78716c" },
  { tag: tags.punctuation, color: "#78716c" },
  { tag: tags.bracket, color: "#78716c" },
  { tag: tags.special(tags.string), color: "#059669" },
]);

type EditorThemeName =
  | "default"
  | "dracula"
  | "cobalt"
  | "solarized-light"
  | "ayu-light"
  | "noctis-lilac"
  | "cool-glow"
  | "espresso";

const THEME_LABELS: Record<EditorThemeName, string> = {
  default: "Default",
  dracula: "Dracula",
  cobalt: "Cobalt",
  "cool-glow": "Cool Glow",
  espresso: "Espresso",
  "noctis-lilac": "Noctis Lilac",
  "solarized-light": "Solarized Light",
  "ayu-light": "Ayu Light",
};

function getThemeExtensions(
  name: EditorThemeName,
  isDark: boolean
): Extension[] {
  switch (name) {
    case "dracula":
      return [dracula];
    case "cobalt":
      return [cobalt];
    case "cool-glow":
      return [coolGlow];
    case "espresso":
      return [espresso];
    case "noctis-lilac":
      return [noctisLilac];
    case "solarized-light":
      return [solarizedLight];
    case "ayu-light":
      return [ayuLight];
    case "default":
    default:
      if (isDark) return [oneDark];
      return [
        warmLightTheme,
        syntaxHighlighting(warmLightHighlight),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      ];
  }
}

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
  const sqlCompartment = useRef(new Compartment());
  const { resolvedTheme } = useTheme();

  // Use refs to avoid stale closures in CodeMirror callbacks
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [editorTheme, setEditorTheme] = useState<EditorThemeName>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("qv-editor-theme") as EditorThemeName) ||
        "default"
      );
    }
    return "default";
  });

  const handleThemeChange = (name: EditorThemeName) => {
    setEditorTheme(name);
    localStorage.setItem("qv-editor-theme", name);
  };

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      sqlCompartment.current.of(sql({ dialect: PostgreSQL, schema: tables, upperCaseKeywords: true })),
      autocompletion(),
      closeBrackets(),
      history(),
      lineNumbers(),
      placeholderExt("Write your SQL here..."),
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
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        "&": { height: "220px", fontFamily: "var(--font-mono)" },
        ".cm-scroller": { overflow: "auto" },
      }),
      ...getThemeExtensions(editorTheme, isDark),
    ];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, editorTheme]);

  // Update SQL schema when tables change (without recreating editor)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: sqlCompartment.current.reconfigure(
        sql({ dialect: PostgreSQL, schema: tables, upperCaseKeywords: true })
      ),
    });
  }, [tables]);

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
    <div className="flex flex-col gap-1">
      <div className="flex justify-end">
        <select
          value={editorTheme}
          onChange={(e) =>
            handleThemeChange(e.target.value as EditorThemeName)
          }
          className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        >
          {Object.entries(THEME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-xl border border-primary/20 overflow-hidden" ref={containerRef} />
    </div>
  );
}
