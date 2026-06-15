import { DailyHeroCard } from "@/components/daily/daily-hero-card";
import { DailyToast } from "@/components/daily/daily-toast";
import { TwoPathCards } from "@/components/home/two-path-cards";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--qv-gradient-hero)" }}>
        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Go from SQL Zero to Interview Ready
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Structured lessons + 75 practice problems. No installations.
        </p>
      </section>

      {/* Two-Path Cards */}
      <TwoPathCards />

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

      {/* Daily Toast for returning users */}
      <DailyToast />
    </div>
  );
}
