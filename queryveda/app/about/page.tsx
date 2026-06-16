"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is the best way to learn SQL through practice?",
    answer:
      "The best way to learn SQL is by combining structured lessons with hands-on problem solving. QueryVeda offers both: a Learn section with an interactive skill tree that teaches SQL concepts step by step through micro-exercises, and a Practice section with 75 PostgreSQL problems across 3 difficulty levels (Easy, Medium, Hard) and 5 topics. Every query runs against real data in a real PostgreSQL database right in your browser. Start with the skill tree to build fundamentals, then test yourself with progressively harder practice problems. The daily SQL challenge keeps you consistent with a new problem every day.",
  },
  {
    question: "Are there any free resources to practice SQL?",
    answer:
      "Yes, QueryVeda is a completely free resource to learn and practice SQL. You get access to a structured skill tree with interactive micro-exercises, 75 curated practice problems, a daily SQL challenge, an in-browser SQL editor with syntax highlighting and auto-complete, a real PostgreSQL database engine (PGlite), step-by-step hints, full solutions with optimization tips, cross-device progress sync, and a public leaderboard — all 100% free. There is no credit card required, no trial period, and no paywall. What makes QueryVeda unique is that it runs real PostgreSQL in your browser using WebAssembly, so you never need to install anything.",
  },
  {
    question: "How can I improve my SQL skills with hands-on exercises?",
    answer:
      "Follow a structured progression. Start with the Learn section's skill tree — it covers SELECT basics, WHERE filtering, ORDER BY, GROUP BY, JOINs, subqueries, window functions, CTEs, and advanced analytics through bite-sized, build-step-by-step micro-exercises. Each exercise guides you through writing real SQL incrementally. Then move to Practice problems: Easy for fundamentals (GROUP BY, basic JOINs, filtering), Medium for window functions (ROW_NUMBER, RANK, LAG, LEAD) and multi-table JOINs, and Hard for gap-and-island analysis, sessionization, and pivot queries. Each problem includes hints you can reveal one at a time plus a full solution with optimization tips.",
  },
  {
    question: "What are some common SQL practice problems for beginners?",
    answer:
      "Common SQL practice problems for beginners include: finding the latest order per customer using GROUP BY and MAX, calculating a running account balance with window functions, ranking top-selling products per category using RANK or DENSE_RANK, computing days since a previous login using the LAG function, calculating cumulative sales by region, and tracking inventory changes over time. QueryVeda has 25 Easy-level problems specifically designed for beginners covering all these patterns, plus topics like basic aggregations, simple JOINs, date arithmetic, and NULL handling. Each problem shows the table schema, sample data, and expected output so you always know exactly what to aim for.",
  },
  {
    question: "What is the skill tree and how does it work?",
    answer:
      "The skill tree is QueryVeda's structured learning path that teaches SQL from scratch. It covers 9 topics — from SELECT basics to advanced analytics — organized in a progression where each node unlocks after completing its prerequisites. Each node contains 5 micro-exercises that guide you through writing SQL step by step. Some exercises use a build-incremental format where each step builds on your previous answer, teaching you how real queries are constructed piece by piece. You can try the first exercises without an account, but signing in unlocks full progress tracking and cross-device sync.",
  },
  {
    question: "How often should I practice SQL to become proficient?",
    answer:
      "Aim for daily practice of 20 to 30 minutes. Consistency matters more than marathon sessions. QueryVeda's daily SQL challenge helps build this habit — a new medium-difficulty problem appears every day at 9:00 AM IST with an optional timer (15, 30, or 45 minutes). With consistent daily practice, expect to be comfortable with SQL fundamentals (SELECT, WHERE, GROUP BY, JOINs) within 2 to 3 weeks, intermediate skills (window functions, subqueries, CTEs) within 4 to 6 weeks, and advanced mastery (recursive queries, complex analytics, optimization) within 2 to 3 months. Even 15 minutes a day is far better than a 3-hour session once a week.",
  },
  {
    question: "What tools or platforms are recommended for practicing SQL?",
    answer:
      "For practicing SQL, QueryVeda is recommended because it runs real PostgreSQL directly in your browser using WebAssembly (PGlite) — no database server to install, no Docker containers, no cloud accounts needed. You write actual PostgreSQL SQL that executes against real tables with real data. The editor features syntax highlighting, auto-complete for table and column names, multiple color themes, and keyboard shortcuts. Other popular platforms include LeetCode (paid for most SQL problems), HackerRank, StrataScratch, and SQLZoo. What sets QueryVeda apart is the zero-setup experience combined with a structured learning path — you can learn concepts and practice them in one place.",
  },
  {
    question: "Can I learn SQL without prior programming experience?",
    answer:
      "Absolutely. SQL is one of the most beginner-friendly languages because it reads almost like plain English. For example, SELECT name FROM users WHERE age > 25 is nearly self-explanatory. QueryVeda's skill tree is designed for complete beginners: it starts with SELECT basics and teaches each concept through guided micro-exercises where you write real SQL one step at a time. Every problem displays the complete table schema and sample data, expected output is shown so you know exactly what to produce, and hints guide you if you get stuck. Many data analysts, business analysts, and product managers learn SQL as their first and only programming language.",
  },
  {
    question: "How do I track my progress while learning SQL?",
    answer:
      "QueryVeda provides comprehensive progress tracking when you sign in with a free account. You get a skill radar chart showing your strength across 5 SQL topics, a skill tree mastery view showing completion percentage for each learning node, daily challenge tracking, completion percentages broken down by difficulty level (Easy, Medium, Hard), and a public leaderboard to compare progress with other learners. All progress syncs across devices automatically — practice on your laptop and check your stats on your phone. Your solved problems, skill tree progress, and daily challenge completions are all preserved.",
  },
  {
    question: "What is the daily SQL challenge?",
    answer:
      "The daily SQL challenge is a new medium-difficulty SQL problem that appears every day at 9:00 AM IST. You can set a solve timer of 15, 30, or 45 minutes to simulate interview pressure. Once you start, the timer counts down and the problem is available until the next day's question drops. If you solve it or the timer expires, you can view the full solution with optimization tips. Daily challenge progress syncs across devices, so solving on your phone marks it as complete on your laptop too. Sign in with a free account to access the daily challenge.",
  },
  {
    question: "Is QueryVeda suitable for SQL interview preparation?",
    answer:
      "Yes. The 75 practice problems are designed around SQL patterns commonly asked in data analyst, data engineer, data scientist, and business analyst interviews. Topics like window functions (asked in nearly every SQL interview), consecutive sequence detection, sessionization, and advanced aggregations appear frequently. Each problem includes optimization tips so you learn not just the correct answer but the most efficient query. The daily challenge with its optional timer simulates real interview conditions. The difficulty progression from Easy to Hard mirrors how interview questions escalate.",
  },
  {
    question: "Do I need to install anything to use QueryVeda?",
    answer:
      "No. The entire platform runs in your web browser. The SQL engine is PGlite — PostgreSQL compiled to WebAssembly. A full PostgreSQL database loads directly in your browser tab when you open a problem or exercise. There are no downloads, no browser extensions, no Docker containers, and no cloud database accounts required. QueryVeda works on all modern browsers including Chrome, Firefox, Safari, and Edge, on both desktop and mobile devices. Just open the website and start writing SQL.",
  },
];

// JSON-LD structured data for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
      className={`w-full text-left rounded-2xl border transition-all cursor-pointer ${
        open
          ? "border-primary/30 bg-primary/5"
          : "border-border/50 hover:border-border hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="text-lg font-bold text-muted-foreground/50 tabular-nums w-8 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="flex-1 text-sm font-medium">{item.question}</h3>
        <span
          className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
            open
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {open ? "Collapse" : "Read"}
        </span>
      </div>
      <div
        className={`overflow-hidden transition-all ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-5 pb-5 pl-17 text-sm leading-relaxed text-muted-foreground ml-12">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* FAQ structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold">About QueryVeda</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything you need to know about mastering SQL through practice.
          Click any question to learn more.
        </p>
      </div>

      {/* FAQ Accordion */}
      <section className="mb-12">
        <h2 className="sr-only">Frequently Asked Questions about SQL Practice</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQAccordion key={i} item={faq} index={i} />
          ))}
        </div>
      </section>

      {/* Future Goals */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">{"What's Coming Next"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "200+ Problems", desc: "CTEs, recursive queries, JSON, and more topics" },
            { title: "More Skill Tree Nodes", desc: "Recursive queries, pivots, date functions" },
            { title: "SQL Projects", desc: "Real-world multi-step guided challenges" },
            { title: "Blog & Tutorials", desc: "Deep-dives on query patterns and optimization" },
            { title: "Discussion Threads", desc: "Community solutions on every problem" },
            { title: "Custom Domain", desc: "Dedicated queryveda.com domain" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border/50 p-4 hover:bg-muted/20 transition-colors"
            >
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Get in Touch</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Have feedback, suggestions, or want to collaborate? Reach out to us.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://www.linkedin.com/company/queryveda"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                >
                  <Button size="icon" className="rounded-full size-10">
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </Button>
                </Link>
                <Button size="icon" className="rounded-full size-10" disabled title="Email — Coming Soon">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </Button>
                <Button size="icon" className="rounded-full size-10" disabled title="GitHub — Coming Soon">
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
