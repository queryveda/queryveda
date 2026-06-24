"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ProfileStats } from "@/lib/profile";
import { questions } from "@/lib/questions";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";
import type { Topic } from "@/lib/types";

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

  // Branding
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("QueryVeda", 60, 56);

  // Display name
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.fillText(displayName, 60, 120);

  // Member since
  if (stats.memberSince) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, sans-serif";
    const d = new Date(stats.memberSince);
    ctx.fillText(`Member since ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, 60, 152);
  }

  // Big stats row
  const statItems = [
    { label: "Solved", value: `${stats.totalSolved}/${questions.length}` },
    { label: "Completion", value: `${stats.completionPercent}%` },
    { label: "Streak", value: `${stats.streak} days` },
    { label: "Active Days", value: `${stats.activeDays}` },
  ];
  let sx = 60;
  for (const item of statItems) {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.fillText(item.value, sx, 230);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(item.label, sx, 256);
    sx += 240;
  }

  // Difficulty bars
  const diffs = [
    { label: "Easy", ...stats.byDifficulty.Easy, color: DIFFICULTY_COLORS.Easy },
    { label: "Medium", ...stats.byDifficulty.Medium, color: DIFFICULTY_COLORS.Medium },
    { label: "Hard", ...stats.byDifficulty.Hard, color: DIFFICULTY_COLORS.Hard },
  ];
  let dy = 310;
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Difficulty", 60, dy);
  dy += 30;
  for (const d of diffs) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`${d.label}  ${d.solved}/${d.total}`, 60, dy);
    // Bar background
    ctx.fillStyle = "#334155";
    ctx.fillRect(220, dy - 12, 300, 14);
    // Bar fill
    const pct = d.total > 0 ? d.solved / d.total : 0;
    ctx.fillStyle = d.color;
    ctx.fillRect(220, dy - 12, 300 * pct, 14);
    dy += 30;
  }

  // Topic mastery bars
  const shortLabels: Record<string, string> = {
    "Aggregations & JOINs": "JOINs",
    "Window Functions": "Windows",
    "Cumulative & Sliding Windows": "Cumulative",
    "Consecutive Sequences": "Sequences",
    "Advanced Analytics": "Analytics",
  };
  let ty = 310;
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Topics", 620, ty);
  ty += 30;
  for (const t of stats.byTopic) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`${shortLabels[t.topic] ?? t.topic}  ${t.solved}/${t.total}`, 620, ty);
    ctx.fillStyle = "#334155";
    ctx.fillRect(800, ty - 12, 300, 14);
    const pct = t.total > 0 ? t.solved / t.total : 0;
    ctx.fillStyle = TOPIC_COLORS[t.topic as Topic] ?? "#8b5cf6";
    ctx.fillRect(800, ty - 12, 300 * pct, 14);
    ty += 30;
  }

  // Achievements (bottom row — top 4 unlocked)
  const unlocked = stats.achievements.filter((a) => a.unlocked).slice(0, 4);
  if (unlocked.length > 0) {
    let ax = 60;
    const ay = 560;
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Achievements", 60, ay - 20);
    ctx.font = "14px system-ui, sans-serif";
    for (const a of unlocked) {
      // Pill background
      const text = `${a.icon} ${a.name}`;
      const tw = ctx.measureText(text).width + 24;
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      roundedRect(ctx, ax, ay - 12, tw, 28, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(text, ax + 12, ay + 6);
      ax += tw + 12;
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
