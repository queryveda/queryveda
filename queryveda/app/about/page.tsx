import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">About QueryVeda</h1>
      <p className="mb-8 text-muted-foreground">
        A free, open-source SQL practice platform built for learners and professionals.
      </p>

      {/* What is QueryVeda */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">What is QueryVeda?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          QueryVeda is an interactive SQL practice platform with 75 carefully curated PostgreSQL
          problems spanning 5 topics and 3 difficulty levels. Every query runs entirely in your
          browser using PGlite (PostgreSQL compiled to WebAssembly) — no server, no setup, no
          waiting. Just open the site and start writing SQL.
        </p>
      </section>

      {/* Key Features */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">In-Browser PostgreSQL</CardTitle>
              <CardDescription>
                Powered by PGlite WASM. Write real SQL, get instant results — no backend needed.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">75 Curated Problems</CardTitle>
              <CardDescription>
                From easy aggregations to hard analytics across Window Functions, JOINs,
                Cumulative Windows, Consecutive Sequences, and Advanced Analytics.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress Tracking</CardTitle>
              <CardDescription>
                Streaks, achievements, and skill radar. Sign in to sync progress across devices.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Multiple Editor Themes</CardTitle>
              <CardDescription>
                Choose from 8 editor themes including Dracula, Cobalt, Solarized, and more.
                Dark and light site themes supported.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Tech Stack</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li><span className="font-medium text-foreground">Framework:</span> Next.js 14 (Static Export)</li>
              <li><span className="font-medium text-foreground">Language:</span> TypeScript</li>
              <li><span className="font-medium text-foreground">Styling:</span> Tailwind CSS + shadcn/ui</li>
              <li><span className="font-medium text-foreground">SQL Engine:</span> PGlite (WASM)</li>
              <li><span className="font-medium text-foreground">Editor:</span> CodeMirror 6</li>
              <li><span className="font-medium text-foreground">Auth:</span> Supabase (Google, LinkedIn, Email)</li>
              <li><span className="font-medium text-foreground">Hosting:</span> GitHub Pages</li>
              <li><span className="font-medium text-foreground">CI/CD:</span> GitHub Actions</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Future Goals */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Future Goals</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">-</span>
                <span><span className="font-medium text-foreground">More Problems</span> — Expand beyond 75 to 200+ problems covering CTEs, recursive queries, JSON, and more.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">-</span>
                <span><span className="font-medium text-foreground">Blogs Section</span> — SQL tutorials, tips, and deep-dives on query optimization.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">-</span>
                <span><span className="font-medium text-foreground">Projects Section</span> — Real-world SQL projects with multi-step challenges and datasets.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">-</span>
                <span><span className="font-medium text-foreground">Custom Domain</span> — Move to a dedicated domain with improved SEO.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">-</span>
                <span><span className="font-medium text-foreground">Discussion & Comments</span> — Community discussion threads on each problem.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">-</span>
                <span><span className="font-medium text-foreground">Interview Prep Mode</span> — Timed challenges simulating SQL interview rounds.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
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
