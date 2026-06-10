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
      "The best way to learn SQL is by solving real problems — not just reading syntax. QueryVeda gives you 75 PostgreSQL problems across 5 topics (Window Functions, JOINs, Cumulative Windows, Consecutive Sequences, and Advanced Analytics) with instant feedback. Start with Easy problems to build confidence, then progress to Medium and Hard. Every query runs in your browser using real PostgreSQL — no setup, no fake SQL simulators.",
  },
  {
    question: "Are there any free resources to practice SQL?",
    answer:
      "Yes! QueryVeda is completely free. You get 75 curated problems, an in-browser PostgreSQL engine, syntax highlighting, auto-complete, hints, and full solutions — all without paying anything. Just open the site and start writing SQL. No credit card, no trial period, no hidden paywalls.",
  },
  {
    question: "How can I improve my SQL skills with hands-on exercises?",
    answer:
      "Start with the Easy problems to nail fundamentals like GROUP BY, aggregate functions, and basic JOINs. Then move to Medium problems that introduce window functions (ROW_NUMBER, LAG, LEAD), running totals, and multi-table joins. Finally, tackle Hard problems covering sessionization, gap-and-island detection, universal quantification, and advanced analytics. Each problem has hints you can reveal one at a time, plus a full solution with optimization tips.",
  },
  {
    question: "What are some common SQL practice problems for beginners?",
    answer:
      "Beginners should start with: finding the latest order per customer (GROUP BY + MAX), calculating running account balances (window functions), counting top-selling products per category (RANK), and computing days since previous login (LAG). QueryVeda's Easy problems cover all these patterns and more — 25 problems designed specifically for building a strong SQL foundation.",
  },
  {
    question: "How long does it take to learn SQL through practice?",
    answer:
      "With focused daily practice, you can become comfortable with SQL fundamentals in 2-3 weeks by solving 3-5 Easy problems per day. Intermediate skills (window functions, complex JOINs) take another 2-3 weeks of Medium problems. Advanced mastery (CTEs, recursive queries, analytics) requires consistent practice over 1-2 months. QueryVeda tracks your streaks and progress to keep you motivated throughout the journey.",
  },
  {
    question: "What tools or platforms are recommended for practicing SQL?",
    answer:
      "QueryVeda stands out because it runs real PostgreSQL directly in your browser using WebAssembly — no database server to install, no Docker containers, no cloud accounts. You write actual SQL that executes against real tables with real data. Other options require setting up local databases or rely on simplified SQL engines that don't match production behavior. With QueryVeda, what works here works in production.",
  },
  {
    question: "Can I learn SQL without prior programming experience?",
    answer:
      "Absolutely. SQL is one of the most beginner-friendly languages because it reads almost like English: SELECT name FROM users WHERE age > 25. QueryVeda's Easy problems assume zero prior experience. Each problem shows the table schema, sample data, and expected output so you always know what to aim for. If you get stuck, reveal hints one at a time before checking the solution.",
  },
  {
    question: "What are the benefits of learning SQL through practical exercises?",
    answer:
      "Reading SQL tutorials teaches you syntax. Solving problems teaches you thinking. When you practice with real data and immediate feedback, you develop pattern recognition — you start seeing when to use a window function vs. a subquery, when GROUP BY is enough vs. when you need a CTE. QueryVeda's instant feedback loop (write query, run, see results, compare) builds this intuition faster than any textbook.",
  },
  {
    question: "How do I track my progress while learning SQL?",
    answer:
      "Sign in to QueryVeda and your progress syncs automatically. You get: a skill radar showing strength across all 5 topics, streak tracking to build daily habits, achievement badges for milestones, and a completion percentage for each difficulty level. The leaderboard lets you see how you compare with other learners. All progress syncs across devices — practice on your laptop, check progress on your phone.",
  },
  {
    question: "What are some advanced SQL practice challenges?",
    answer:
      "QueryVeda's Hard problems include: detecting consecutive login streaks with gap-and-island analysis, sessionizing user activity with time-based windows, finding users who purchased from ALL categories (universal quantification), pivoting rows to columns without CROSSTAB, computing 7-day rolling active user counts, and building credit score improvement detection. These are the exact patterns asked in data engineering and analytics interviews.",
  },
  {
    question: "Is QueryVeda suitable for SQL interview preparation?",
    answer:
      "Yes — the problems are specifically designed around patterns commonly asked in data analyst, data engineer, and data scientist interviews at top companies. Topics like window functions, consecutive sequences, and advanced analytics come up frequently in SQL rounds. Each problem also includes optimization tips so you learn not just the correct answer but the efficient one.",
  },
  {
    question: "Do I need to install anything to use QueryVeda?",
    answer:
      "No. QueryVeda runs entirely in your browser. The SQL engine (PGlite) is PostgreSQL compiled to WebAssembly, which means a full PostgreSQL database loads right in your browser tab. No downloads, no extensions, no Docker. Just open the site and start writing SQL. Works on Chrome, Firefox, Safari, and Edge.",
  },
];

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className={`w-full text-left rounded-2xl border transition-all ${
        open
          ? "border-primary/30 bg-primary/5"
          : "border-border/50 hover:border-border hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="text-lg font-bold text-muted-foreground/50 tabular-nums w-8 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-sm font-medium">{item.question}</span>
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
      {open && (
        <div className="px-5 pb-5 pl-17">
          <p className="text-sm leading-relaxed text-muted-foreground pl-12">
            {item.answer}
          </p>
        </div>
      )}
    </button>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
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
            {
              title: "200+ Problems",
              desc: "CTEs, recursive queries, JSON, and more",
            },
            {
              title: "Blog & Tutorials",
              desc: "Deep-dives on query optimization",
            },
            {
              title: "SQL Projects",
              desc: "Real-world multi-step challenges",
            },
            {
              title: "Interview Prep Mode",
              desc: "Timed challenges for SQL rounds",
            },
            {
              title: "Discussion Threads",
              desc: "Community solutions on every problem",
            },
            {
              title: "Custom Domain",
              desc: "Dedicated domain with improved SEO",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border/50 p-4 hover:bg-muted/20 transition-colors"
            >
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.desc}
              </p>
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
                Have feedback, suggestions, or want to collaborate? Reach out to
                us.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://www.linkedin.com/company/queryveda"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="rounded-full gap-2">
                    <svg
                      className="size-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </Button>
                </Link>
                <Button className="rounded-full gap-2" disabled>
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email — Coming Soon
                </Button>
                <Button className="rounded-full gap-2" disabled>
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Contact — Coming Soon
                </Button>
                <Button className="rounded-full gap-2" disabled>
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Text — Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
