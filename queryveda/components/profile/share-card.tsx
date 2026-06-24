"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ProfileStats } from "@/lib/profile";
import { questions } from "@/lib/questions";

interface ShareCardButtonProps {
  displayName: string;
  stats: ProfileStats;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, color: string
) {
  ctx.fillStyle = "#334155";
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (pct > 0) {
    ctx.fillStyle = color;
    roundedRect(ctx, x, y, Math.max(w * pct, h), h, h / 2);
    ctx.fill();
  }
}

function drawCard(canvas: HTMLCanvasElement, displayName: string, stats: ProfileStats) {
  const ctx = canvas.getContext("2d")!;
  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle border
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // Branding
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText("QueryVeda", 60, 48);

  // Display name
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 38px system-ui, sans-serif";
  ctx.fillText(displayName, 60, 100);

  // Member since
  if (stats.memberSince) {
    ctx.fillStyle = "#64748b";
    ctx.font = "14px system-ui, sans-serif";
    const d = new Date(stats.memberSince);
    ctx.fillText(`Member since ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, 60, 126);
  }

  // Stat pills row
  const allUnlocked = [...stats.achievements, ...stats.excelStats.achievements].filter((a) => a.unlocked);
  const pills = [
    { label: "Solved", value: `${stats.totalSolved}/${questions.length}` },
    { label: "Completion", value: `${stats.completionPercent}%` },
    { label: "Streak", value: `${stats.streak}d` },
    { label: "Active Days", value: `${stats.activeDays}` },
    { label: "Achievements", value: `${allUnlocked.length}` },
  ];
  let px = 60;
  const py = 162;
  ctx.font = "14px system-ui, sans-serif";
  for (const pill of pills) {
    const text = `${pill.value}  ${pill.label}`;
    const tw = ctx.measureText(text).width + 28;
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    roundedRect(ctx, px, py - 14, tw, 30, 15);
    ctx.fill();
    ctx.stroke();
    // Value (bold)
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 14px system-ui, sans-serif";
    const vw = ctx.measureText(pill.value).width;
    ctx.fillText(pill.value, px + 14, py + 4);
    // Label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(pill.label, px + 14 + vw + 6, py + 4);
    px += tw + 10;
  }

  // --- Two columns ---
  const colLeft = 60;
  const colRight = 620;
  const barW = 280;

  // Left column: SQL Practice
  let ly = 230;
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("SQL PRACTICE", colLeft, ly);
  ly += 28;

  // SQL big number + overall bar
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText(`${stats.totalSolved}`, colLeft, ly);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(`/ ${questions.length} problems`, colLeft + ctx.measureText(`${stats.totalSolved}`).width + 8 - (ctx.font = "bold 28px system-ui, sans-serif", ctx.font = "14px system-ui, sans-serif", 0), ly);
  // Recalculate properly
  ctx.font = "bold 28px system-ui, sans-serif";
  const solvedW = ctx.measureText(`${stats.totalSolved}`).width;
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`/ ${questions.length} problems`, colLeft + solvedW + 8, ly);
  ly += 16;
  drawBar(ctx, colLeft, ly, barW, 8, stats.completionPercent / 100, "#8b5cf6");
  ly += 26;

  // Difficulty bars
  const diffs = [
    { label: "Easy", ...stats.byDifficulty.Easy, color: "#22c55e" },
    { label: "Medium", ...stats.byDifficulty.Medium, color: "#eab308" },
    { label: "Hard", ...stats.byDifficulty.Hard, color: "#ef4444" },
  ];
  for (const d of diffs) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(d.label, colLeft, ly + 4);
    drawBar(ctx, colLeft + 70, ly - 4, 180, 8, d.total > 0 ? d.solved / d.total : 0, d.color);
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`${d.solved}/${d.total}`, colLeft + 260, ly + 4);
    ly += 24;
  }

  // Topic bars
  ly += 8;
  const shortLabels: Record<string, string> = {
    "Aggregations & JOINs": "JOINs",
    "Window Functions": "Windows",
    "Cumulative & Sliding Windows": "Cumulative",
    "Consecutive Sequences": "Sequences",
    "Advanced Analytics": "Analytics",
  };
  for (const t of stats.byTopic) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(shortLabels[t.topic] ?? t.topic, colLeft, ly + 4);
    drawBar(ctx, colLeft + 90, ly - 4, 160, 8, t.total > 0 ? t.solved / t.total : 0, "#8b5cf6");
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`${t.solved}/${t.total}`, colLeft + 260, ly + 4);
    ly += 24;
  }

  // Right column: Excel Skills
  let ry = 230;
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("EXCEL SKILLS", colRight, ry);
  ry += 28;

  const excelPct = stats.excelStats.totalItems > 0
    ? Math.round((stats.excelStats.totalCompleted / stats.excelStats.totalItems) * 100)
    : 0;
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText(`${stats.excelStats.totalCompleted}`, colRight, ry);
  const exSolvedW = ctx.measureText(`${stats.excelStats.totalCompleted}`).width;
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`/ ${stats.excelStats.totalItems} items`, colRight + exSolvedW + 8, ry);
  ry += 16;
  drawBar(ctx, colRight, ry, barW, 8, excelPct / 100, "#10b981");
  ry += 26;

  // Excel node bars
  for (const m of stats.excelStats.nodeMasteries) {
    const pct = m.total > 0 ? m.completed / m.total : 0;
    const shortTitle = m.title.split("&")[0].trim();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(shortTitle.slice(0, 12), colRight, ry + 4);
    drawBar(ctx, colRight + 110, ry - 4, 140, 8, pct, "#10b981");
    ctx.fillStyle = "#64748b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(`${m.completed}/${m.total}`, colRight + 260, ry + 4);
    ry += 24;
  }

  // Achievement pills at bottom
  if (allUnlocked.length > 0) {
    let ax = 60;
    const ay = 580;
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("ACHIEVEMENTS", 60, ay - 24);
    ctx.font = "13px system-ui, sans-serif";
    for (const a of allUnlocked.slice(0, 6)) {
      const text = `${a.icon} ${a.name}`;
      const tw = ctx.measureText(text).width + 20;
      if (ax + tw > W - 60) break;
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      roundedRect(ctx, ax, ay - 10, tw, 26, 13);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(text, ax + 10, ay + 6);
      ax += tw + 8;
    }
  }
}

export function ShareCardButton({ displayName, stats }: ShareCardButtonProps) {
  const handleDownload = useCallback(() => {
    const canvas = document.createElement("canvas");
    drawCard(canvas, displayName, stats);
    const link = document.createElement("a");
    link.download = "queryveda-profile.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [displayName, stats]);

  return (
    <Button onClick={handleDownload} variant="outline" size="sm" className="rounded-full">
      <Download className="mr-2 h-4 w-4" />
      Download Card
    </Button>
  );
}
