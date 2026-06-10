"use client";

import { TOPICS, TOPIC_COLORS } from "@/lib/constants";
import type { Topic } from "@/lib/types";

interface SkillRadarProps {
  byTopic: { topic: Topic; total: number; solved: number }[];
}

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 100;
const LABEL_RADIUS = 130;
const N = 5;

function angleForAxis(i: number): number {
  // Start from top (-90 deg), go clockwise
  return (Math.PI * 2 * i) / N - Math.PI / 2;
}

function polarToXY(angle: number, r: number): [number, number] {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function polygonPoints(values: number[]): string {
  return values
    .map((v, i) => {
      const [x, y] = polarToXY(angleForAxis(i), v * RADIUS);
      return `${x},${y}`;
    })
    .join(" ");
}

function gridPoints(fraction: number): string {
  return Array.from({ length: N }, (_, i) => {
    const [x, y] = polarToXY(angleForAxis(i), fraction * RADIUS);
    return `${x},${y}`;
  }).join(" ");
}

export function SkillRadar({ byTopic }: SkillRadarProps) {
  const values = TOPICS.map((topic) => {
    const entry = byTopic.find((b) => b.topic === topic);
    if (!entry || entry.total === 0) return 0;
    return entry.solved / entry.total;
  });

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[300px]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full">
          {/* Grid polygons */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon
              key={f}
              points={gridPoints(f)}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeWidth={1}
            />
          ))}

          {/* Axis lines */}
          {TOPICS.map((_, i) => {
            const [x, y] = polarToXY(angleForAxis(i), RADIUS);
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={polygonPoints(values)}
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />

          {/* Data points */}
          {values.map((v, i) => {
            const [x, y] = polarToXY(angleForAxis(i), v * RADIUS);
            return (
              <circle key={i} cx={x} cy={y} r={4} fill="hsl(var(--primary))" />
            );
          })}

          {/* Labels */}
          {TOPICS.map((topic, i) => {
            const angle = angleForAxis(i);
            const [x, y] = polarToXY(angle, LABEL_RADIUS);
            const anchor =
              Math.abs(Math.cos(angle)) < 0.1
                ? "middle"
                : Math.cos(angle) > 0
                ? "start"
                : "end";
            const shortLabels: Record<Topic, string> = {
              "Aggregations & JOINs": "JOINs",
              "Window Functions": "Windows",
              "Cumulative & Sliding Windows": "Cumulative",
              "Consecutive Sequences": "Sequences",
              "Advanced Analytics": "Analytics",
            };
            return (
              <text
                key={topic}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={10}
                fill={TOPIC_COLORS[topic as Topic]}
                fontWeight={600}
              >
                {shortLabels[topic as Topic]}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
