/* protect.js — Anti-scraping and copy protection */

(function() {
  // Disable right-click context menu
  document.addEventListener("contextmenu", e => e.preventDefault());

  // Block view-source and dev-tools shortcuts
  document.addEventListener("keydown", e => {
    // Ctrl+U (view source), Ctrl+S (save), F12 (dev tools)
    if ((e.ctrlKey || e.metaKey) && e.key === "u") e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && e.key === "s") e.preventDefault();
    if (e.key === "F12") e.preventDefault();
    // Ctrl+Shift+I (dev tools), Ctrl+Shift+J (console), Ctrl+Shift+C (inspect)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I","i","J","j","C","c"].includes(e.key)) e.preventDefault();
  });

  // Disable text selection on page content (CSS injection)
  const style = document.createElement("style");
  style.textContent = `
    body, .left, .desc, .tblbox, .solution-box, .hero, .topics-section,
    .problems-page, .progress-page, .topic-card, .problem-row, .badge-card,
    .hint-item, h1, h2, h3, p, span, td, th, pre {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    /* Allow selection inside CodeMirror editor only */
    .CodeMirror, .CodeMirror * {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);

  // Disable drag
  document.addEventListener("dragstart", e => e.preventDefault());

  // Disable copy on page content (not inside CodeMirror)
  document.addEventListener("copy", e => {
    if (!e.target.closest || !e.target.closest(".CodeMirror")) {
      e.preventDefault();
    }
  });
})();
