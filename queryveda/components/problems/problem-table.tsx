"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Question, QuestionStatus } from "@/lib/types";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";

const STATUS_EMOJI: Record<QuestionStatus, string> = {
  solved: "✅",
  attempted: "🟡",
  todo: "",
};

interface ProblemTableProps {
  questions: Question[];
  getStatus: (id: number) => QuestionStatus;
}

export function ProblemTable({ questions, getStatus }: ProblemTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 w-12">#</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3 w-28">Difficulty</th>
            <th className="px-4 py-3">Topic</th>
            <th className="px-4 py-3 w-16 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const status = getStatus(q.id);
            return (
              <tr
                key={q.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 text-muted-foreground">{q.id}</td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/practice/${q.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {q.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: DIFFICULTY_COLORS[q.difficulty] + "22",
                      color: DIFFICULTY_COLORS[q.difficulty],
                      borderColor: DIFFICULTY_COLORS[q.difficulty] + "44",
                    }}
                    className="text-xs"
                  >
                    {q.difficulty}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: TOPIC_COLORS[q.topic] + "22",
                      color: TOPIC_COLORS[q.topic],
                      borderColor: TOPIC_COLORS[q.topic] + "44",
                    }}
                    className="text-xs"
                  >
                    {q.topic}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  {STATUS_EMOJI[status]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
