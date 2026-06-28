# App Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the navbar+content+footer layout with a sidebar (desktop) + floating dock (mobile) app shell, redesign the home page as a bento dashboard, and add a two-panel layout to the skill tree page.

**Architecture:** New `AppShell` component wraps `Sidebar` + content on desktop and `MobileDock` + content on mobile, replacing `Navbar` + `Footer` in `layout.tsx`. Home page becomes a bento grid of data cards. Skill tree page gains a detail panel.

**Tech Stack:** Next.js 14 (App Router, static export), React 18, Tailwind CSS 3.4, shadcn/ui, lucide-react, next-themes.

## Global Constraints

- Static export (`output: 'export'`) — no server components with dynamic data, all data is client-side (localStorage + PGlite)
- All components using `usePathname`/`useSearchParams` must be wrapped in `<Suspense>` for static build
- Purple/violet color palette unchanged — use existing CSS custom properties (`--primary`, `--qv-gradient-card`, etc.)
- `lg` breakpoint (1024px) is the mobile/desktop split
- Existing hooks (`useAuth`, `useTrack`, `useDailyStatus`, `useSkillTree`) are the data layer — consume them, don't rewrite
- `prefers-reduced-motion` must disable all animations
- No new npm dependencies

---

### Task 1: Sidebar Component

**Files:**
- Create: `components/layout/sidebar.tsx`

**Interfaces:**
- Consumes: `usePathname()` from `next/navigation`, `useAuth()` from `@/hooks/use-auth`, `useTrack()` from `@/hooks/use-track`, `useDailyStatus()` from `@/hooks/use-daily-status`, `useTourState()` from `@/hooks/use-tour-state`, `ThemeToggle` from `@/components/layout/theme-toggle`
- Produces: `<Sidebar />` — a fixed left sidebar, 64px collapsed, 220px on hover, with nav items. Accepts no props. Used by `AppShell` in Task 3.

- [ ] **Step 1: Create the sidebar component**

Create `components/layout/sidebar.tsx`:

```tsx
"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTrack } from "@/hooks/use-track";
import { useDailyStatus } from "@/hooks/use-daily-status";
import { useTourState } from "@/hooks/use-tour-state";
import { ThemeToggle } from "./theme-toggle";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  Home,
  BookOpen,
  Table2,
  Zap,
  ClipboardList,
  BarChart3,
  Trophy,
  User,
  HelpCircle,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn SQL", icon: BookOpen, track: "sql" as const },
  { href: "/excel", label: "Learn Excel", icon: Table2, track: "excel" as const },
  { href: "/daily", label: "Daily", icon: Zap, hasBadge: true },
  { href: "/problems", label: "Problems", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { hasTrack } = useTrack();
  const { hasUnattempted } = useDailyStatus();
  const { reset: resetTour } = useTourState();
  const [expanded, setExpanded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Hide sidebar on shared profile view
  if (pathname === "/profile" && searchParams.has("share")) return null;

  // On practice page, disable hover expand
  const isPracticePage = pathname.startsWith("/practice/");

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const filteredNav = mainNav.filter(({ track }) => {
    if (!track) return true;
    return hasTrack(track);
  });

  return (
    <>
      <aside
        onMouseEnter={() => !isPracticePage && setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed left-0 top-0 z-50 hidden lg:flex flex-col h-screen border-r border-border bg-card/95 backdrop-blur-sm transition-[width] duration-200 ease-out ${
          expanded ? "w-[220px]" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 shrink-0">
          <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight overflow-hidden">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
              QV
            </span>
            <span
              className={`whitespace-nowrap transition-opacity duration-150 ${
                expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
              }`}
            >
              QueryVeda
            </span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-2 overflow-y-auto">
          {filteredNav.map(({ href, label, icon: Icon, hasBadge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? label : undefined}
                className={`relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary" />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-150 ${
                    expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
                  }`}
                >
                  {label}
                </span>
                {/* Daily unattempted badge */}
                {hasBadge && hasUnattempted && !active && (
                  <span className="absolute top-1.5 left-8 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col gap-1 px-2 py-3 border-t border-border shrink-0">
          {/* Profile / Auth */}
          {user ? (
            <Link
              href="/profile"
              title={!expanded ? user.name : undefined}
              className={`flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                isActive("/profile")
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} width={20} height={20} className="rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`whitespace-nowrap truncate transition-opacity duration-150 ${
                  expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
                }`}
              >
                {user.name}
              </span>
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              title={!expanded ? "Sign In" : undefined}
              className="flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors overflow-hidden"
            >
              <User className="w-5 h-5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-150 ${
                  expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
                }`}
              >
                Sign In
              </span>
            </button>
          )}

          {/* Help / Tour */}
          <button
            onClick={() => {
              resetTour();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("queryveda:start-tour"));
              }, 100);
            }}
            title={!expanded ? "Take a tour" : undefined}
            className="flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors overflow-hidden"
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span
              className={`whitespace-nowrap transition-opacity duration-150 ${
                expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
              }`}
            >
              Help
            </span>
          </button>

          {/* Theme toggle */}
          <div className="flex items-center gap-3 h-10 px-3 overflow-hidden">
            <ThemeToggle />
            <span
              className={`whitespace-nowrap text-sm text-muted-foreground transition-opacity duration-150 ${
                expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
              }`}
            >
              Theme
            </span>
          </div>
        </div>
      </aside>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense>
      <SidebarContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify sidebar renders in isolation**

Temporarily import `<Sidebar />` in `app/layout.tsx` after `<Navbar />` to check it renders. Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in the browser. The sidebar should appear on the left side on desktop. The existing navbar is still there — that's fine, we're just verifying the sidebar works.

- [ ] **Step 3: Remove the temporary sidebar import**

Revert `app/layout.tsx` to its original state (remove the temporary `<Sidebar />` import). The sidebar will be integrated properly via `AppShell` in Task 3.

- [ ] **Step 4: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat: add desktop sidebar navigation component"
```

---

### Task 2: Mobile Dock Component

**Files:**
- Create: `components/layout/mobile-dock.tsx`

**Interfaces:**
- Consumes: `usePathname()`, `useTrack()` from `@/hooks/use-track`
- Produces: `<MobileDock />` — a floating bottom navigation pill for mobile. Accepts no props. Used by `AppShell` in Task 3.

- [ ] **Step 1: Create the mobile dock component**

Create `components/layout/mobile-dock.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTrack } from "@/hooks/use-track";
import { Home, BookOpen, Zap, BarChart3, User } from "lucide-react";

const dockItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/daily", label: "Daily", icon: Zap },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/profile", label: "Me", icon: User },
];

function MobileDockContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasTrack } = useTrack();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Hide on shared profile view
  if (pathname === "/profile" && searchParams.has("share")) return null;

  // Hide on practice IDE page
  if (pathname.startsWith("/practice/")) return null;

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  // "Learn" item should go to the user's selected track
  const getHref = (href: string) => {
    if (href === "/learn") {
      return hasTrack("excel") && !hasTrack("sql") ? "/excel" : "/learn";
    }
    return href;
  };

  return (
    <div
      className={`fixed bottom-3 left-4 right-4 z-50 lg:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-[calc(100%+24px)]"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="flex items-center justify-around h-14 rounded-full bg-background/70 backdrop-blur-xl border border-border/50 shadow-lg">
        {dockItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const resolvedHref = getHref(href);
          return (
            <Link
              key={href}
              href={resolvedHref}
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 relative"
              aria-label={label}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {/* Active glow dot */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/50" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileDock() {
  return (
    <Suspense>
      <MobileDockContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify dock renders**

Temporarily import `<MobileDock />` in `app/layout.tsx` after `<Footer />`. Run `npm run dev`, open the browser at mobile width. The floating dock should appear at the bottom. Remove the temporary import after confirming.

- [ ] **Step 3: Commit**

```bash
git add components/layout/mobile-dock.tsx
git commit -m "feat: add floating mobile dock navigation component"
```

---

### Task 3: AppShell + Layout Integration

**Files:**
- Create: `components/layout/app-shell.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `<Sidebar />` from Task 1, `<MobileDock />` from Task 2
- Produces: `<AppShell>` — wraps `{children}` with sidebar margin on desktop and dock padding on mobile. Replaces `<Navbar />` and `<Footer />` in `layout.tsx`.

- [ ] **Step 1: Create the AppShell component**

Create `components/layout/app-shell.tsx`:

```tsx
import { Sidebar } from "./sidebar";
import { MobileDock } from "./mobile-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="lg:ml-16 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
      <MobileDock />
    </>
  );
}
```

- [ ] **Step 2: Update layout.tsx to use AppShell**

Replace the contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { PlatformTour } from "@/components/layout/platform-tour";
import { ProtectionWrapper } from "@/components/layout/protection-wrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "QueryVeda — Master SQL by Doing",
  description: "Practice 75 PostgreSQL problems in your browser. No server needed.",
  icons: {
    icon: `${basePath}/favicon.png`,
    apple: `${basePath}/favicon.png`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <ProtectionWrapper />
            <AppShell>{children}</AppShell>
            <ScrollToTop />
            <PlatformTour />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Run the build to verify**

```bash
npm run build
```

Expected: Build succeeds. All 116+ static pages generated. No prerender errors.

- [ ] **Step 4: Verify in the browser**

```bash
npm run dev
```

Check:
- Desktop: sidebar visible on left, content shifted right by 64px, no navbar at top, no footer at bottom
- Mobile: no sidebar, floating dock at bottom, content has bottom padding
- Navigate between pages — sidebar and dock highlight the correct active item
- Practice page: sidebar stays collapsed (no hover expand), dock is hidden

- [ ] **Step 5: Commit**

```bash
git add components/layout/app-shell.tsx app/layout.tsx
git commit -m "feat: integrate app shell, replace navbar and footer"
```

---

### Task 4: Bento Dashboard — Card Components and Grid

**Files:**
- Create: `components/home/bento-card.tsx`
- Create: `components/home/dashboard-greeting.tsx`
- Create: `components/home/bento-dashboard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/hooks/use-auth`, `useTrack()` from `@/hooks/use-track`, `useDailyStatus()` from `@/hooks/use-daily-status`, `countSolved` / `getCurrentStreak` / `isSolved` from `@/lib/storage`, `getDueReviews` from `@/lib/review`, `getSortedQuestions` from `@/lib/questions`, `fetchDailyQuestion` / `getDailyState` / `todayIST` from `@/lib/daily`, `getNextSuggestion` from `@/lib/next-question`, `DailyHeroCard` from `@/components/daily/daily-hero-card`, `ReviewCard` from `@/components/home/review-card`
- Produces: `<BentoDashboard />` — the bento grid home page for logged-in users. `<BentoCard />` — reusable card with gradient border and hover lift. `<DashboardGreeting />` — greeting header with stats.

- [ ] **Step 1: Create BentoCard component**

Create `components/home/bento-card.tsx`:

```tsx
import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
}

export function BentoCard({ children, className = "" }: BentoCardProps) {
  return (
    <div
      className={`rounded-2xl p-[1px] transition-all duration-150 hover:shadow-md hover:-translate-y-[1px] ${className}`}
      style={{ background: "var(--qv-gradient-card)" }}
    >
      <div className="rounded-2xl bg-card p-5 h-full">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DashboardGreeting component**

Create `components/home/dashboard-greeting.tsx`:

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { getCurrentStreak, countSolved } from "@/lib/storage";
import { getSortedQuestions } from "@/lib/questions";

export function DashboardGreeting() {
  const { user } = useAuth();
  const questions = getSortedQuestions();
  const solved = countSolved(questions);
  const streak = getCurrentStreak();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-baseline justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {streak > 0 && <>{streak}-day streak &middot; </>}
          {solved} problem{solved !== 1 ? "s" : ""} solved
        </p>
      </div>
      <span className="text-sm text-muted-foreground hidden sm:block">{today}</span>
    </div>
  );
}
```

- [ ] **Step 3: Create BentoDashboard component**

Create `components/home/bento-dashboard.tsx`:

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTrack } from "@/hooks/use-track";
import { countSolved, isSolved, countByTopic } from "@/lib/storage";
import { getSortedQuestions } from "@/lib/questions";
import { getDueReviews } from "@/lib/review";
import { getNextSuggestion } from "@/lib/next-question";
import { fetchDailyQuestion, getDailyState, todayIST, type DailyQuestion } from "@/lib/daily";
import { BentoCard } from "./bento-card";
import { DashboardGreeting } from "./dashboard-greeting";
import { Button } from "@/components/ui/button";
import { Zap, BarChart3, RotateCcw, Trophy, ArrowRight, BookOpen, Table2 } from "lucide-react";

function DailyCard() {
  const [daily, setDaily] = useState<DailyQuestion | null>(null);
  const [solved, setSolved] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchDailyQuestion().then((dq) => {
      if (dq && dq.date === todayIST()) {
        setDaily(dq);
        const state = getDailyState();
        setSolved(state.solved);
        setStarted(!!state.startedAt);
      }
    });
  }, []);

  return (
    <BentoCard>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Daily Challenge</h3>
        </div>
        {daily ? (
          <>
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
              &ldquo;{daily.question.title}&rdquo;
            </p>
            <Link href="/daily">
              <Button size="sm" className="rounded-full w-full">
                {solved ? "View Solution" : started ? "Continue" : "Solve Now"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground flex-1">
            Check back after 9:00 AM IST
          </p>
        )}
      </div>
    </BentoCard>
  );
}

function ProgressCard() {
  const questions = getSortedQuestions();
  const solved = countSolved(questions);
  const total = questions.length;
  const pct = Math.round((solved / total) * 100);

  return (
    <BentoCard>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Your Progress</h3>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">{solved}</span>
            <span className="text-sm text-muted-foreground">/ {total} solved</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Link href="/progress">
          <Button variant="outline" size="sm" className="rounded-full w-full">
            View Details
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function ReviewQueueCard() {
  const { user } = useAuth();
  const dueReviews = user ? getDueReviews() : [];

  if (dueReviews.length === 0) return null;

  const bucketCounts = { hard: 0, medium: 0, easy: 0 };
  for (const r of dueReviews) {
    bucketCounts[r.bucket]++;
  }

  return (
    <BentoCard>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold">Review Queue</h3>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{dueReviews.length}</p>
          <p className="text-sm text-muted-foreground">
            items due
          </p>
          <div className="flex gap-2 mt-2">
            {bucketCounts.hard > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">{bucketCounts.hard} hard</span>
            )}
            {bucketCounts.medium > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">{bucketCounts.medium} med</span>
            )}
            {bucketCounts.easy > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">{bucketCounts.easy} easy</span>
            )}
          </div>
        </div>
        <Link href={`/practice/${dueReviews[0].questionId}/`}>
          <Button size="sm" className="rounded-full w-full">
            Start Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function RankCard() {
  // Leaderboard rank is not currently stored client-side.
  // Show a link to leaderboard instead.
  return (
    <BentoCard>
      <div className="flex flex-col gap-2 h-full items-center justify-center text-center">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="font-semibold text-sm">Leaderboard</h3>
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm" className="rounded-full text-xs">
            View Rankings
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function NextQuestionCard() {
  const questions = getSortedQuestions();
  const suggestion = useMemo(() => {
    const unsolved = questions.filter((q) => !isSolved(q.id));
    if (unsolved.length === 0) return null;
    return getNextSuggestion(unsolved[0], isSolved);
  }, [questions]);

  if (!suggestion) return null;

  return (
    <BentoCard>
      <div className="flex flex-col gap-2 h-full items-center justify-center text-center">
        <ArrowRight className="w-6 h-6 text-primary" />
        <h3 className="font-semibold text-sm">Next Up</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.topic}</p>
        <Link href={`/practice/${suggestion.id}/`}>
          <Button size="sm" className="rounded-full text-xs">
            Go <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </BentoCard>
  );
}

function SkillTreeCards() {
  const { hasTrack } = useTrack();

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {hasTrack("sql") && (
        <Link href="/learn" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">SQL Track</h3>
                <p className="text-xs text-muted-foreground">Continue learning</p>
              </div>
            </div>
          </BentoCard>
        </Link>
      )}
      {hasTrack("excel") && (
        <Link href="/excel" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Excel Track</h3>
                <p className="text-xs text-muted-foreground">Continue learning</p>
              </div>
            </div>
          </BentoCard>
        </Link>
      )}
    </div>
  );
}

function LoggedOutHero() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
          Master{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--qv-gradient-accent)" }}>
            SQL & Excel
          </span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Structured lessons + hands-on practice. No installations.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DailyCard />
        <BentoCard>
          <div className="flex flex-col gap-3 h-full">
            <h3 className="font-semibold">Start Your Journey</h3>
            <ul className="text-sm text-muted-foreground space-y-2 flex-1">
              <li>75+ curated SQL problems</li>
              <li>In-browser PostgreSQL & Excel</li>
              <li>Progress tracking & streaks</li>
            </ul>
          </div>
        </BentoCard>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        <Link href="/learn" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Learn SQL</h3>
                <p className="text-xs text-muted-foreground">Step-by-step skill tree</p>
              </div>
            </div>
          </BentoCard>
        </Link>
        <Link href="/excel" className="shrink-0 flex-1 min-w-[200px]">
          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Learn Excel</h3>
                <p className="text-xs text-muted-foreground">Interactive spreadsheets</p>
              </div>
            </div>
          </BentoCard>
        </Link>
      </div>
    </div>
  );
}

export function BentoDashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <LoggedOutHero />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <DashboardGreeting />

      {/* Row 1: Daily + Progress — large cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <DailyCard />
        <ProgressCard />
      </div>

      {/* Row 2: Review + Rank + Next — medium + small cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <ReviewQueueCard />
        </div>
        <RankCard />
        <NextQuestionCard />
      </div>

      {/* Row 3: Skill Trees */}
      <SkillTreeCards />
    </div>
  );
}
```

- [ ] **Step 4: Update app/page.tsx to use BentoDashboard**

Replace the contents of `app/page.tsx` with:

```tsx
import { HomeRedirectGuard } from "@/components/home/home-client";
import { BentoDashboard } from "@/components/home/bento-dashboard";
import { DailyToast } from "@/components/daily/daily-toast";

export default function Home() {
  return (
    <HomeRedirectGuard>
      <BentoDashboard />
      <DailyToast />
    </HomeRedirectGuard>
  );
}
```

- [ ] **Step 5: Run the build**

```bash
npm run build
```

Expected: Build succeeds. No errors.

- [ ] **Step 6: Verify in browser**

```bash
npm run dev
```

Check:
- Logged-in: bento grid with greeting, daily challenge, progress, review queue, rank, next question, skill tree cards
- Logged-out: simplified hero + teaser cards
- Mobile: single-column stack, cards are full-width
- Desktop: two-column grid, cards have hover lift effect

- [ ] **Step 7: Commit**

```bash
git add components/home/bento-card.tsx components/home/dashboard-greeting.tsx components/home/bento-dashboard.tsx app/page.tsx
git commit -m "feat: replace home page with bento dashboard layout"
```

---

### Task 5: Skill Tree Page — Two-Panel Layout (Desktop) + Bottom Sheet (Mobile)

**Files:**
- Create: `components/learn/skill-tree-panel.tsx`
- Create: `components/learn/node-bottom-sheet.tsx`
- Modify: `app/learn/learn-client.tsx`

**Interfaces:**
- Consumes: `useSkillTree()` from `@/hooks/use-skill-tree`, `SkillTreeMap` from `@/components/learn/skill-tree-map`, `isSolved` from `@/lib/storage`, `getNextSuggestion` from `@/lib/next-question`, whatever node type `SkillTreeMap` passes on click (needs investigation at implementation time — the skill tree map likely emits a node ID or node object)
- Produces: `<SkillTreePanel node={node} />` — right panel showing node detail. `<NodeBottomSheet node={node} open={boolean} onClose={() => void} />` — mobile bottom sheet alternative.

**Note to implementer:** Before writing code, read `components/learn/skill-tree-map.tsx` and `hooks/use-skill-tree.ts` to understand the exact node type and click handler interface. The code below uses placeholder types that you must align with the actual codebase. The key question is: what data does a skill tree node contain, and how does clicking a node currently work? Adapt the panel/sheet components to match.

- [ ] **Step 1: Read the skill tree map and hook**

```bash
cat components/learn/skill-tree-map.tsx
cat hooks/use-skill-tree.ts
```

Identify:
- The node type (likely has `id`, `label`, `exercises`, etc.)
- The current click behavior (likely navigates to `/learn/[nodeId]`)
- The `getNodeMastery` function signature

Record these for use in the next steps.

- [ ] **Step 2: Create SkillTreePanel component**

Create `components/learn/skill-tree-panel.tsx`. This is the right-side detail panel for desktop.

The component should:
- Accept a `node` prop (matching the type from step 1)
- Show the node's topic name as a heading
- Show a progress bar (X/Y exercises completed, using `isSolved` from `@/lib/storage`)
- List the exercises in the node with solved/unsolved indicators
- Show a [Continue] button linking to the first unsolved exercise
- If no node is selected, show a placeholder: "Select a topic from the tree"

Use the exact types and field names you discovered in step 1. Style with existing design tokens (`bg-card`, `text-primary`, `rounded-2xl`, etc.).

- [ ] **Step 3: Create NodeBottomSheet component**

Create `components/learn/node-bottom-sheet.tsx`. This is the mobile bottom sheet.

The component should:
- Accept `node`, `open`, and `onClose` props
- Render as a fixed-position overlay at the bottom of the screen
- Start at 50% screen height, with a drag handle bar at the top
- Use the same content as `SkillTreePanel` but in a more compact vertical layout
- Backdrop click dismisses the sheet
- Animate in with `translate-y` transition

Implementation approach: Use a `div` with `fixed bottom-0 inset-x-0` and `transition-transform`. The backdrop is a separate `fixed inset-0 bg-black/40` div. No library needed — keep it simple with CSS transitions.

- [ ] **Step 4: Update learn-client.tsx with two-panel layout**

Modify `app/learn/learn-client.tsx` to:
- Add `selectedNode` state
- Pass an `onNodeClick` callback to `SkillTreeMap` (if the map supports it) or intercept navigation
- Desktop: render a two-panel layout — `SkillTreeMap` on the left (~65%), `SkillTreePanel` on the right (~35%)
- Mobile: render `SkillTreeMap` full width + `NodeBottomSheet` triggered on node click
- Add a track switcher pill at the top: `[SQL | Excel]` linking to `/learn` and `/excel`

The updated structure should look like:

```tsx
<div className="h-[calc(100vh-0px)] lg:h-screen flex flex-col">
  {/* Track switcher */}
  <div className="flex items-center justify-between px-4 py-4">
    <h1 className="text-2xl font-bold">Learn SQL</h1>
    <div className="flex rounded-full bg-muted p-0.5">
      <Link href="/learn" className="px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">SQL</Link>
      <Link href="/excel" className="px-3 py-1 rounded-full text-sm font-medium text-muted-foreground">Excel</Link>
    </div>
  </div>

  {/* Two-panel layout */}
  <div className="flex-1 flex overflow-hidden">
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <SkillTreeMap getMastery={getNodeMastery} onNodeClick={setSelectedNode} />
    </div>
    {/* Desktop panel */}
    <div className="hidden lg:block w-[320px] border-l border-border overflow-y-auto p-4">
      <SkillTreePanel node={selectedNode} />
    </div>
  </div>

  {/* Mobile bottom sheet */}
  <NodeBottomSheet node={selectedNode} open={!!selectedNode} onClose={() => setSelectedNode(null)} />
</div>
```

**Important:** The `SkillTreeMap` component may not currently support an `onNodeClick` prop — it might navigate directly to `/learn/[nodeId]`. If so, you'll need to modify the `SkillTreeMap` to accept an optional `onNodeClick` callback. When provided, it should call the callback instead of navigating. When not provided (e.g., from the excel page), it should keep its current behavior.

- [ ] **Step 5: Run the build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Verify in browser**

Check:
- Desktop: two-panel layout, clicking a node shows detail in right panel
- Mobile: clicking a node opens bottom sheet
- Track switcher toggles between SQL and Excel
- [Continue] button navigates to the correct practice page

- [ ] **Step 7: Commit**

```bash
git add components/learn/skill-tree-panel.tsx components/learn/node-bottom-sheet.tsx app/learn/learn-client.tsx
git commit -m "feat: add two-panel skill tree layout with mobile bottom sheet"
```

---

### Task 6: Cleanup and Polish

**Files:**
- Modify: `app/globals.css` (add noise texture utility)
- Delete or archive: `components/layout/navbar.tsx`, `components/layout/mobile-drawer.tsx`, `components/layout/footer.tsx`
- Modify: `components/home/two-path-cards.tsx` (may still be imported elsewhere — check before deleting)

**Interfaces:**
- Consumes: nothing new
- Produces: cleaned-up codebase with no dead code

- [ ] **Step 1: Check for remaining imports of old components**

```bash
grep -r "navbar" --include="*.tsx" --include="*.ts" -l
grep -r "footer" --include="*.tsx" --include="*.ts" -l
grep -r "mobile-drawer" --include="*.tsx" --include="*.ts" -l
grep -r "two-path-cards" --include="*.tsx" --include="*.ts" -l
```

If `navbar.tsx`, `footer.tsx`, or `mobile-drawer.tsx` are only imported by `layout.tsx` (which no longer uses them), they can be deleted. If `two-path-cards.tsx` is only imported by the old `page.tsx`, it can be deleted too.

- [ ] **Step 2: Delete dead components**

Delete the files identified in step 1 as unused. Do NOT delete if they're still imported somewhere.

- [ ] **Step 3: Add noise texture utility to globals.css**

Add to the `@layer components` section of `app/globals.css`:

```css
.noise-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

Then add `noise-bg relative` to the `BentoCard` wrapper div to use it.

Also add a reduced-motion media query to the base layer:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run final build**

```bash
npm run build
```

Expected: Build succeeds. No warnings about unused imports.

- [ ] **Step 5: Full manual verification**

Test the complete flow:
- Home page (logged in and logged out)
- Sidebar navigation (desktop)
- Floating dock (mobile)
- Skill tree page (both panels)
- Practice IDE page (sidebar collapsed, dock hidden)
- All other pages render inside the app shell
- Theme toggle works from sidebar
- Dark mode and light mode both look correct

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: clean up old navbar/footer, add noise texture utility"
```
