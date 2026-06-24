import type { Question, Topic } from "@/lib/types";
import { getSortedQuestions } from "@/lib/questions";
import { DIFFICULTY_ORDER } from "@/lib/constants";

export function getNextSuggestion(
  currentQuestion: Question,
  isSolved: (id: number) => boolean
): Question | null {
  const all = getSortedQuestions();
  const unsolved = all.filter((q) => q.id !== currentQuestion.id && !isSolved(q.id));

  if (unsolved.length === 0) return null;

  // Strategy 1: Same topic, same or higher difficulty
  const sameTopic = unsolved.filter((q) => q.topic === currentQuestion.topic);
  if (sameTopic.length > 0) {
    const currentDiff = DIFFICULTY_ORDER[currentQuestion.difficulty];
    // Find easiest unsolved at or above current difficulty
    const escalated = sameTopic.filter(
      (q) => DIFFICULTY_ORDER[q.difficulty] >= currentDiff
    );
    if (escalated.length > 0) {
      // Sort by difficulty asc, then id asc
      escalated.sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
          a.id - b.id
      );
      return escalated[0];
    }
    // All remaining in topic are easier — just pick first
    return sameTopic[0];
  }

  // Strategy 2: Weakest topic (lowest completion %)
  const topicCompletion = new Map<Topic, { solved: number; total: number }>();
  for (const q of all) {
    const entry = topicCompletion.get(q.topic) || { solved: 0, total: 0 };
    entry.total++;
    if (isSolved(q.id)) entry.solved++;
    topicCompletion.set(q.topic, entry);
  }

  let weakestTopic: Topic | null = null;
  let lowestPct = Infinity;
  topicCompletion.forEach(({ solved, total }, topic) => {
    const pct = solved / total;
    // Only consider topics that have unsolved questions
    if (unsolved.some((q) => q.topic === topic) && pct < lowestPct) {
      lowestPct = pct;
      weakestTopic = topic;
    }
  });

  if (weakestTopic) {
    const weakestUnsolved = unsolved
      .filter((q) => q.topic === weakestTopic)
      .sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] ||
          a.id - b.id
      );
    return weakestUnsolved[0];
  }

  // Absolute fallback
  return unsolved[0];
}
