"use client";

import type { PlanNode } from "@/lib/pglite";

interface PlanViewerProps {
  plan: PlanNode | null;
}

function costColor(cost: number, maxCost: number): string {
  if (maxCost === 0) return "text-foreground";
  const ratio = cost / maxCost;
  if (ratio > 0.6) return "text-orange-500 dark:text-orange-400";
  if (ratio > 0.3) return "text-yellow-600 dark:text-yellow-400";
  return "text-foreground";
}

function findMaxCost(node: PlanNode): number {
  let max = node["Total Cost"];
  for (const child of node.Plans ?? []) {
    max = Math.max(max, findMaxCost(child));
  }
  return max;
}

function NodeRow({ node, maxCost, depth }: { node: PlanNode; maxCost: number; depth: number }) {
  const label = node["Node Type"] + (node["Join Type"] ? ` (${node["Join Type"]})` : "");
  const relation = node["Relation Name"];
  const cost = node["Total Cost"];
  const rows = node["Plan Rows"];
  const filter = node["Filter"];
  const sortKey = node["Sort Key"];
  const indexName = node["Index Name"];

  return (
    <div>
      <div className="flex items-baseline gap-2 py-1" style={{ paddingLeft: `${depth * 20}px` }}>
        <span className="text-muted-foreground select-none">→</span>
        <span className="font-medium">{label}</span>
        {relation && (
          <span className="text-muted-foreground text-xs">
            on <span className="font-mono">{relation}</span>
          </span>
        )}
        {indexName && (
          <span className="text-muted-foreground text-xs">
            using <span className="font-mono">{indexName}</span>
          </span>
        )}
        <span className={`ml-auto text-xs tabular-nums ${costColor(cost, maxCost)}`}>
          cost: {cost.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          rows: {rows}
        </span>
      </div>
      {filter && (
        <div className="text-xs text-muted-foreground font-mono" style={{ paddingLeft: `${depth * 20 + 28}px` }}>
          Filter: {filter}
        </div>
      )}
      {sortKey && (
        <div className="text-xs text-muted-foreground font-mono" style={{ paddingLeft: `${depth * 20 + 28}px` }}>
          Sort Key: {sortKey.join(", ")}
        </div>
      )}
      {(node.Plans ?? []).map((child, i) => (
        <NodeRow key={i} node={child} maxCost={maxCost} depth={depth + 1} />
      ))}
    </div>
  );
}

export function PlanViewer({ plan }: PlanViewerProps) {
  if (!plan) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Run a query to see its execution plan.
      </p>
    );
  }

  const maxCost = findMaxCost(plan);

  return (
    <div className="rounded-xl border border-primary/20 p-3 text-sm font-mono overflow-x-auto">
      <NodeRow node={plan} maxCost={maxCost} depth={0} />
    </div>
  );
}
