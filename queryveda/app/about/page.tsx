import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
        <p className="text-sm text-muted-foreground text-center">
          Built with care. Have feedback or suggestions? Reach out on GitHub.
        </p>
      </section>
    </div>
  );
}
