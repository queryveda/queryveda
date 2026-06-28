"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";

const ADS = [
  { text: "Master SQL with guided skill trees", emoji: "🎯", href: "/learn" },
  { text: "Try our Excel formula challenges", emoji: "📊", href: "/excel" },
  { text: "Climb the leaderboard — compete with others", emoji: "🏆", href: "/leaderboard" },
  { text: "75+ SQL problems from Easy to Hard", emoji: "🔥", href: "/practice" },
  { text: "See query execution plans in real time", emoji: "⚡" },
  { text: "Track your progress across all topics", emoji: "📈", href: "/learn" },
  { text: "Free forever — no signup required to practice", emoji: "🎉" },
  { text: "Built-in PostgreSQL — runs entirely in your browser", emoji: "🚀" },
];

function MarqueeBanner() {
  return (
    <div
      className="shrink-0 overflow-hidden border-t border-border/50 bg-card"
      data-slot="sidebar-ad"
    >
      <div className="marquee-track flex items-center gap-8 whitespace-nowrap py-3 px-4">
        {[...ADS, ...ADS].map((ad, i) => {
          const content = (
            <span className="inline-flex items-center gap-2 text-sm" key={i}>
              <span>{ad.emoji}</span>
              <span
                className={`font-medium ${ad.href ? "text-primary" : "text-foreground/80"}`}
              >
                {ad.text}
              </span>
              <span className="text-muted-foreground/30 mx-2">|</span>
            </span>
          );
          return ad.href ? (
            <Link
              key={i}
              href={ad.href}
              className="hover:opacity-80 transition-opacity shrink-0"
            >
              {content}
            </Link>
          ) : (
            <span key={i} className="shrink-0">
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitPane({ left, right }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const startX = e.clientX;
    const leftEl = container.querySelector(
      "[data-pane='left']"
    ) as HTMLElement;
    const startWidth = leftEl.getBoundingClientRect().width;
    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(
        200,
        Math.min(startWidth + ev.clientX - startX, window.innerWidth - 300)
      );
      container.style.gridTemplateColumns = `${newW}px 6px 1fr`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  return (
    <>
      {/* Desktop: resizable split pane */}
      <div
        ref={containerRef}
        className="hidden md:grid h-[calc(100vh-8rem)]"
        style={{ gridTemplateColumns: "400px 6px 1fr" }}
      >
        {/* Left pane: scrollable question + pinned marquee at bottom */}
        <div data-pane="left" className="flex flex-col bg-card h-full">
          <div className="flex-1 overflow-auto">
            <div className="p-5 min-h-full">{left}</div>
          </div>
          <MarqueeBanner />
        </div>
        <div
          className="cursor-col-resize bg-border hover:bg-primary transition-colors"
          onMouseDown={handleMouseDown}
        />
        <div className="overflow-auto p-5 flex flex-col gap-3">{right}</div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col md:hidden">
        <div className="border-b p-4">{left}</div>
        <div className="p-4 flex flex-col gap-3">{right}</div>
      </div>
    </>
  );
}
