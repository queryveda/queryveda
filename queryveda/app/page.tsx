import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOPICS, TOPIC_COLORS } from "@/lib/constants";
import { DailyHeroCard } from "@/components/daily/daily-hero-card";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--qv-gradient-hero)" }}>
        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Master SQL by Doing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          75 PostgreSQL practice problems running entirely in your browser. No server, no setup, instant feedback.
        </p>
        <div className="mt-8">
          <Link href="/problems">
            <Button size="lg" className="text-base px-8 py-6">Start Practicing</Button>
          </Link>
        </div>
      </section>

      {/* Daily Challenge */}
      <DailyHeroCard />

      {/* Features — subtle inline list */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>75 curated problems</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>In-browser PostgreSQL</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>Progress tracking & streaks</span>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold">Topics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((topic) => (
            <Link key={topic} href={`/problems?topic=${encodeURIComponent(topic)}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 h-1 w-12 rounded" style={{ backgroundColor: TOPIC_COLORS[topic] }} />
                  <CardTitle className="text-base">{topic}</CardTitle>
                  <CardDescription>15 problems</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
