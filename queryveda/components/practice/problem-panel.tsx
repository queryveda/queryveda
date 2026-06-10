"use client";

import { Badge } from "@/components/ui/badge";
import { ResultTable } from "./result-table";
import type { Question } from "@/lib/types";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";
import type { QueryResult } from "@/lib/pglite";

interface ProblemPanelProps {
  question: Question;
  schemaTables: Record<string, QueryResult>;
}

export function ProblemPanel({ question, schemaTables }: ProblemPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          style={{ backgroundColor: DIFFICULTY_COLORS[question.difficulty] }}
          className="text-white"
        >
          {question.difficulty}
        </Badge>
        <Badge
          style={{ backgroundColor: TOPIC_COLORS[question.topic] }}
          className="text-white"
        >
          {question.topic}
        </Badge>
      </div>

      <p className="text-sm whitespace-pre-wrap">{question.desc}</p>

      {question.note && (
        <p className="text-sm text-muted-foreground italic">
          Note: {question.note}
        </p>
      )}

      {/* Schema tables */}
      {Object.entries(schemaTables).map(([tableName, result]) => (
        <div key={tableName}>
          <h4 className="text-sm font-semibold mb-1">{tableName}</h4>
          <ResultTable cols={result.cols} rows={result.rows} />
        </div>
      ))}

      {/* Expected output */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Expected Output</h4>
        <ResultTable cols={question.cols} rows={question.rows} />
      </div>
    </div>
  );
}
