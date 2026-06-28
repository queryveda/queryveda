"use client";

import { useRef, useCallback } from "react";

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
        <div data-pane="left" className="overflow-auto p-5 bg-card h-full">
          {left}
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
