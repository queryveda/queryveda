"use client";
import { Suspense } from "react";
import { questions } from "@/lib/questions";
import { useFilters } from "@/hooks/use-filters";
import { useStorage } from "@/hooks/use-storage";
import { FilterBar } from "@/components/problems/filter-bar";
import { SearchInput } from "@/components/problems/search-input";
import { ProblemCard } from "@/components/problems/problem-card";
import { ProblemTable } from "@/components/problems/problem-table";

function ProblemsContent() {
  const { difficulty, setDifficulty, topic, setTopic, search, setSearch, filtered } = useFilters(questions);
  const { getStatus } = useStorage();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Problems</h1>
      <div className="mb-6 flex flex-col gap-4">
        <SearchInput value={search} onChange={setSearch} />
        <FilterBar difficulty={difficulty} topic={topic} onDifficultyChange={setDifficulty} onTopicChange={setTopic} />
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} problem{filtered.length !== 1 ? "s" : ""}</p>
      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((q) => <ProblemCard key={q.id} question={q} status={getStatus(q.id)} />)}
      </div>
      {/* Desktop: table */}
      <div className="hidden md:block">
        <ProblemTable questions={filtered} getStatus={getStatus} />
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  return <Suspense><ProblemsContent /></Suspense>;
}
