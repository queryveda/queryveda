import { questions } from "@/lib/questions";
import { PracticeClient } from "./practice-client";

export function generateStaticParams() {
  return questions.map((q) => ({ id: String(q.id) }));
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PracticeClient id={id} />;
}
