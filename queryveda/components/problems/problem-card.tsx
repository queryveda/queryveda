"use client";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { Question, QuestionStatus } from "@/lib/types";
import { DIFFICULTY_COLORS, TOPIC_COLORS } from "@/lib/constants";

const STATUS_EMOJI: Record<QuestionStatus, string> = {
  solved: "\u2705",
  attempted: "\uD83D\uDFE1",
  todo: "",
};

interface ProblemCardProps {
  question: Question;
  status: QuestionStatus;
}

export function ProblemCard({ question, status }: ProblemCardProps) {
  const { user } = useAuth();
  const isLocked = !user && question.difficulty !== "Easy";

  return (
    <Link href={`/practice/${question.id}`}>
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md ${
          isLocked ? "opacity-60" : ""
        }`}
      >
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {isLocked ? (
                <span className="text-sm">🔒</span>
              ) : (
                STATUS_EMOJI[status] && (
                  <span className="text-sm">{STATUS_EMOJI[status]}</span>
                )
              )}
              <CardTitle className="truncate text-sm font-medium">
                {question.title}
              </CardTitle>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              #{question.id}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge
              style={{
                backgroundColor:
                  DIFFICULTY_COLORS[question.difficulty] + "22",
                color: DIFFICULTY_COLORS[question.difficulty],
                borderColor:
                  DIFFICULTY_COLORS[question.difficulty] + "44",
              }}
              variant="outline"
              className="text-xs"
            >
              {question.difficulty}
            </Badge>
            <Badge
              style={{
                backgroundColor: TOPIC_COLORS[question.topic] + "22",
                color: TOPIC_COLORS[question.topic],
                borderColor: TOPIC_COLORS[question.topic] + "44",
              }}
              variant="outline"
              className="text-xs"
            >
              {question.topic}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
