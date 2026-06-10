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
      "The best way to learn SQL through practice is by solving progressively harder real-world problems with instant feedback. Start with simple SELECT and GROUP BY queries, then build up to window functions and complex JOINs. QueryVeda provides exactly this path: 75 PostgreSQL problems across 3 difficulty levels (Easy, Medium, Hard) and 5 topics. Each problem runs against real data in a real PostgreSQL database right in your browser, so you practice actual SQL — not a simplified version. The key is consistent daily practice with immediate correction: write a query, run it, compare your output to the expected result, and learn from the difference.",
  },
  {
    question: "Are there any free resources to practice SQL?",
    answer:
      "Yes, QueryVeda is a completely free resource to practice SQL. You get access to 75 curated PostgreSQL practice problems, an in-browser SQL editor with syntax highlighting and auto-complete, a real PostgreSQL database engine (PGlite), step-by-step hints, full solutions with optimization tips, progress tracking, and a leaderboard — all 100% free. There is no credit card required, no trial period, and no paywall. Other free SQL resources include SQLZoo, W3Schools SQL exercises, and HackerRank SQL challenges. What makes QueryVeda unique is that it runs real PostgreSQL in your browser using WebAssembly, so you never need to install anything.",
  },
  {
    question: "How can I improve my SQL skills with hands-on exercises?",
    answer:
      "To improve your SQL skills with hands-on exercises, follow a structured progression. Start with Easy problems to master fundamentals: GROUP BY with aggregate functions (COUNT, SUM, AVG, MAX), basic JOINs across 2-3 tables, and simple filtering with WHERE and HAVING. Then advance to Medium problems covering window functions (ROW_NUMBER, RANK, LAG, LEAD), running totals with cumulative SUM, and multi-table JOINs with subqueries. Finally, tackle Hard problems: gap-and-island analysis for consecutive sequences, sessionization with time-based windows, universal quantification, and pivot queries. QueryVeda organizes problems this way, and each one includes hints you can reveal one at a time plus a full solution with optimization tips.",
  },
  {
    question: "What are some common SQL practice problems for beginners?",
    answer:
      "Common SQL practice problems for beginners include: finding the latest order per customer using GROUP BY and MAX, calculating a running account balance with window functions, ranking top-selling products per category using RANK or DENSE_RANK, computing days since a previous login using the LAG function, calculating cumulative sales by region, and tracking inventory changes over time. QueryVeda has 25 Easy-level problems specifically designed for beginners covering all these patterns, plus topics like basic aggregations, simple JOINs, date arithmetic, and NULL handling. Each problem shows the table schema, sample data, and expected output so you always know exactly what to aim for.",
  },
  {
    question: "Is it better to learn SQL through projects or tutorials?",
    answer:
      "Both projects and tutorials have their place, but hands-on practice problems are the fastest path to SQL proficiency. Tutorials teach you syntax and concepts, but without practice you will forget them quickly. Projects are excellent for building portfolio pieces, but they can be overwhelming for beginners who do not yet recognize common SQL patterns. The ideal approach is: learn a concept from a tutorial, then immediately practice it with targeted problems (like those on QueryVeda), and finally apply it in a project. QueryVeda bridges the gap between tutorials and projects by providing focused, bite-sized problems that teach one pattern at a time — from simple GROUP BY to advanced window functions — so you build skills incrementally before tackling full projects.",
  },
  {
    question: "How often should I practice SQL to become proficient?",
    answer:
      "To become proficient in SQL, aim for daily practice of 20 to 30 minutes, solving 2 to 3 problems per session. Consistency matters more than marathon sessions. With this schedule, you can expect to be comfortable with SQL fundamentals (SELECT, WHERE, GROUP BY, JOINs) within 2 to 3 weeks, intermediate skills (window functions, subqueries, CTEs) within 4 to 6 weeks, and advanced mastery (recursive queries, complex analytics, optimization) within 2 to 3 months. QueryVeda helps maintain consistency with streak tracking — your daily practice streak is tracked automatically, and achievements reward milestones like solving 10, 25, and 50 problems. Even practicing just 15 minutes a day is far better than a 3-hour session once a week.",
  },
  {
    question: "What tools or platforms are recommended for practicing SQL?",
    answer:
      "For practicing SQL, QueryVeda is recommended because it runs real PostgreSQL directly in your browser using WebAssembly (PGlite) — no database server to install, no Docker containers, no cloud accounts needed. You write actual PostgreSQL SQL that executes against real tables with real data. The editor features syntax highlighting, auto-complete for table and column names, multiple color themes (Dracula, Cobalt, Solarized, and more), and keyboard shortcuts. Other popular platforms include LeetCode (paid for most SQL problems), HackerRank, StrataScratch, and SQLZoo. What sets QueryVeda apart is the zero-setup experience: open the site, pick a problem, and start writing SQL immediately.",
  },
  {
    question: "Can I learn SQL without prior programming experience?",
    answer:
      "Absolutely, you can learn SQL without any prior programming experience. SQL is one of the most beginner-friendly languages because it reads almost like plain English. For example, SELECT name FROM users WHERE age > 25 is nearly self-explanatory. Unlike Python or JavaScript, SQL does not require understanding variables, loops, or data structures to get started. QueryVeda is designed with beginners in mind: Easy problems assume zero prior SQL knowledge, every problem displays the complete table schema and sample data, expected output is shown so you know exactly what result to produce, and hints guide you step by step if you get stuck. Many data analysts, business analysts, and product managers learn SQL as their first and only programming language.",
  },
  {
    question: "What are the benefits of learning SQL through practical exercises?",
    answer:
      "The benefits of learning SQL through practical exercises rather than just reading tutorials are significant. First, you develop pattern recognition — after solving enough problems, you instinctively know when to use a window function versus a subquery, or when GROUP BY is sufficient versus when you need a CTE. Second, you build muscle memory for SQL syntax, reducing errors and increasing speed. Third, you encounter edge cases (NULLs, empty results, duplicate rows) that tutorials rarely cover but appear constantly in real work. Fourth, practical exercises with instant feedback create a tight learning loop: write, run, compare, correct. QueryVeda maximizes these benefits by providing immediate query execution, automatic result comparison against expected output, and detailed solutions that explain not just the correct answer but the most efficient approach.",
  },
  {
    question: "How do I track my progress while learning SQL?",
    answer:
      "QueryVeda provides comprehensive progress tracking when you sign in with a free account. You get a skill radar chart showing your strength across all 5 SQL topics (Window Functions, Aggregations and JOINs, Cumulative Windows, Consecutive Sequences, and Advanced Analytics), daily streak tracking to help build consistent practice habits, achievement badges awarded at milestones like solving 10, 25, 50, and 75 problems, completion percentages broken down by difficulty level (Easy, Medium, Hard), and a public leaderboard where you can compare your progress with other learners. All progress syncs across devices automatically — practice on your laptop at work and check your stats on your phone. Your solved problems, saved queries, and streaks are all preserved.",
  },
  {
    question: "What are some advanced SQL practice challenges?",
    answer:
      "Advanced SQL practice challenges on QueryVeda include: detecting consecutive login streaks using gap-and-island analysis, sessionizing user activity streams with time-based window boundaries, finding users who purchased from ALL product categories (universal quantification), pivoting rows to columns without using CROSSTAB, computing 7-day rolling active user counts with sliding windows, building credit score improvement detection over time periods, identifying the longest consecutive purchase streaks per customer, and calculating retention cohorts with date-based grouping. These are the exact SQL patterns asked in data engineering and data analyst interviews at top technology companies. Each Hard problem includes an optimized solution showing the most efficient approach.",
  },
  {
    question: "Is QueryVeda suitable for SQL interview preparation?",
    answer:
      "Yes, QueryVeda is well-suited for SQL interview preparation. The 75 problems are specifically designed around SQL patterns commonly asked in data analyst, data engineer, data scientist, and business analyst interviews at companies like Google, Meta, Amazon, and startups. Topics like window functions (asked in nearly every SQL interview), consecutive sequence detection, sessionization, and advanced aggregations appear frequently in SQL interview rounds. Each problem includes optimization tips so you learn not just the correct answer but the most efficient query — interviewers often ask follow-up questions about query performance. The difficulty progression from Easy to Hard mirrors how interview questions escalate in complexity.",
  },
  {
    question: "Do I need to install anything to use QueryVeda?",
    answer:
      "No, you do not need to install anything to use QueryVeda. The entire platform runs in your web browser. The SQL engine is PGlite, which is PostgreSQL compiled to WebAssembly. This means a full, real PostgreSQL database loads directly in your browser tab when you open a problem. There are no downloads, no browser extensions, no Docker containers, and no cloud database accounts required. QueryVeda works on all modern browsers including Chrome, Firefox, Safari, and Edge, on both desktop and mobile devices. Just navigate to the website, pick a problem, and start writing SQL immediately.",
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
            { title: "200+ Problems", desc: "CTEs, recursive queries, JSON, and more" },
            { title: "Blog & Tutorials", desc: "Deep-dives on query optimization" },
            { title: "SQL Projects", desc: "Real-world multi-step challenges" },
            { title: "Interview Prep Mode", desc: "Timed challenges for SQL rounds" },
            { title: "Discussion Threads", desc: "Community solutions on every problem" },
            { title: "Custom Domain", desc: "Dedicated domain with improved SEO" },
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
                >
                  <Button className="rounded-full gap-2">
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </Button>
                </Link>
                <Button className="rounded-full gap-2" disabled>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  Email — Coming Soon
                </Button>
                <Button className="rounded-full gap-2" disabled>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Contact — Coming Soon
                </Button>
                <Button className="rounded-full gap-2" disabled>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
