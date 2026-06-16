import { DailyHeroCard } from "@/components/daily/daily-hero-card";
import { DailyToast } from "@/components/daily/daily-toast";
import { TwoPathCards } from "@/components/home/two-path-cards";
import { HomeRedirectGuard } from "@/components/home/home-client";

export default function Home() {
  return (
    <HomeRedirectGuard>
      <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 py-28 text-center"
        style={{ background: "var(--qv-gradient-hero)" }}
      >
        {/* Decorative glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <h1 className="relative mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          Master{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--qv-gradient-accent)" }}>
            SQL & Excel
          </span>{" "}
          — Interview Ready
        </h1>
        <p className="relative mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Structured lessons + hands-on practice. No installations.
        </p>
      </section>

      {/* Two-Path Cards */}
      <TwoPathCards />

      {/* Daily Challenge */}
      <DailyHeroCard />

      {/* Features — subtle inline list */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>75+ curated problems</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>In-browser PostgreSQL & Excel</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>Progress tracking & streaks</span>
        </div>
      </section>

      {/* Daily Toast for returning users */}
      <DailyToast />
      </div>
    </HomeRedirectGuard>
  );
}
