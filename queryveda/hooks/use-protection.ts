"use client";

import { useEffect } from "react";

export function useProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block devtools key combos and copy outside editor
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+I — DevTools Elements
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+J — DevTools Console
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return;
      }
      // Ctrl+U — View Source
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return;
      }
      // F12 — DevTools
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
    };

    // Block copy outside .cm-editor elements
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const node = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as Element);
      if (node && node.closest(".cm-editor")) return; // allow copy inside editor
      e.preventDefault();
    };

    // Inject style to disable text selection outside .cm-editor
    const style = document.createElement("style");
    style.id = "qv-protection-style";
    style.textContent = `
      body * {
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      .cm-editor,
      .cm-editor * {
        user-select: text !important;
        -webkit-user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      const injected = document.getElementById("qv-protection-style");
      if (injected) injected.remove();
    };
  }, []);
}
