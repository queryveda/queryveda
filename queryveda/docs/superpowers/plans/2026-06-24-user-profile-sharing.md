# User Profile & Stats Sharing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users share their QueryVeda progress via a token-based shareable link with a downloadable stats card image.

**Architecture:** A single `/profile/` static page that reads an optional `?share=<token>` query param. When the token is present, it fetches the user's stats from Supabase and renders a public read-only profile. When visited by the logged-in owner (no token), it shows their own profile with sharing controls. A client-side canvas renderer generates a downloadable PNG share card. A new `user_profiles` Supabase table stores display names and share tokens.

**Tech Stack:** Next.js (static export), Supabase (user_profiles table + RLS), React, Tailwind CSS, HTML Canvas API

## Global Constraints

- `output: 'export'` in next.config.js — no API routes, no SSR, no dynamic meta tags
- No new npm dependencies
- Follow existing component patterns (functional components, Tailwind classes, `"use client"` directive)
- All stats computed client-side from `user_progress` Supabase table (same pattern as leaderboard)
- Privacy: profiles private by default, shareable only via opt-in token

---

### Task 1: Create `user_profiles` Supabase helpers and types

**Files:**
- Create: `lib/profile.ts`

**Interfaces:**
- Consumes: `supabase` client from `lib/supabase.ts`, `AuthUser` from `hooks/use-auth.ts`
- Produces:
  - `UserProfile` type: `{ user_id: string; display_name: string | null; share_token: string | null; created_at: string; updated_at: string }`
  - `ProfileStats` type: `{ totalSolved: number; completionPercent: number; streak: number; activeDays: number; byDifficulty: { Easy: { total: number; solved: number }; Medium: { total: number; solved: number }; Hard: { total: number; solved: number } }; byTopic: { topic: Topic; total: number; solved: number }[]; achievements: Achievement[]; memberSince: string | null }`
  - `getProfileByToken(token: string): Promise<{ profile: UserProfile; stats: ProfileStats } | null>`
  - `getProfileByUserId(userId: string): Promise<UserProfile | null>`
  - `upsertDisplayName(userId: string, displayName: string): Promise<void>`
  - `generateShareToken(userId: string): Promise<string>`
  - `revokeShareToken(userId: string): Promise<void>`
  - `computeProfileStats(userId: string): Promise<ProfileStats>`
  - `getAnonymousName(userId: string): string` (extracted from leaderboard)

- [ ] **Step 1: Create lib/profile.ts with types and all helper functions**

```typescript
import { supabase } from "@/lib/supabase";
import { questions } from "@/lib/questions";
import { TOPICS } from "@/lib/constants";
import type { Topic, Achievement } from "@/lib/types";

// --- Types ---

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileStats {
  totalSolved: number;
  completionPercent: number;
  streak: number;
  activeDays: number;
  byDifficulty: {
    Easy: { total: number; solved: number };
    Medium: { total: number; solved: number };
    Hard: { total: number; solved: number };
  };
  byTopic: { topic: Topic; total: number; solved: number }[];
  achievements: Achievement[];
  memberSince: string | null;
}

// --- Anonymous name generation (extracted from leaderboard) ---

const ADJECTIVES = [
  "Swift", "Clever", "Bold", "Quiet", "Bright", "Cosmic", "Lucky", "Nimble",
  "Witty", "Calm", "Daring", "Epic", "Fierce", "Grand", "Happy", "Jolly",
  "Keen", "Lively", "Mighty", "Noble", "Plucky", "Radiant", "Savvy", "Vivid",
  "Zesty", "Agile", "Brave", "Crisp", "Eager", "Fresh", "Gentle", "Hardy",
];
const ANIMALS = [
  "Falcon", "Panda", "Otter", "Fox", "Eagle", "Wolf", "Dolphin", "Lynx",
  "Hawk", "Bear", "Cobra", "Raven", "Tiger", "Owl", "Heron", "Bison",
  "Crane", "Deer", "Gecko", "Koala", "Moose", "Parrot", "Quail", "Seal",
  "Turtle", "Viper", "Whale", "Yak", "Zebra", "Lemur", "Marten", "Newt",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getAnonymousName(userId: string): string {
  const h = hashCode(userId);
  const adj = ADJECTIVES[h % ADJECTIVES.length];
  const animal = ANIMALS[(h >> 8) % ANIMALS.length];
  const num = (h % 100).toString().padStart(2, "0");
  return `${adj}${animal}${num}`;
}

// --- Profile CRUD ---

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as UserProfile | null;
}

export async function getProfileByToken(
  token: string
): Promise<{ profile: UserProfile; stats: ProfileStats } | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("share_token", token)
    .single();
  if (!data) return null;
  const profile = data as UserProfile;
  const stats = await computeProfileStats(profile.user_id);
  return { profile, stats };
}

export async function upsertDisplayName(userId: string, displayName: string): Promise<void> {
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      display_name: displayName.trim().slice(0, 30) || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function generateShareToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      share_token: token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return token;
}

export async function revokeShareToken(userId: string): Promise<void> {
  await supabase
    .from("user_profiles")
    .update({ share_token: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// --- Stats computation from Supabase ---

export async function computeProfileStats(userId: string): Promise<ProfileStats> {
  const { data } = await supabase
    .from("user_progress")
    .select("question_id, status, solved_at")
    .eq("user_id", userId);

  const rows = data || [];
  const solvedIds = new Set(rows.filter((r) => r.status === "solved").map((r) => r.question_id));
  const solvedDates = rows
    .filter((r) => r.status === "solved" && r.solved_at)
    .map((r) => r.solved_at!.slice(0, 10));
  const uniqueDates = [...new Set(solvedDates)].sort().reverse();

  const totalSolved = solvedIds.size;
  const totalQuestions = questions.length;
  const completionPercent = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  // Streak
  let streak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
        if (diffDays === 1) streak++;
        else break;
      }
    }
  }

  // By difficulty
  const countByDiff = (d: string) => {
    const subset = questions.filter((q) => q.difficulty === d);
    return { total: subset.length, solved: subset.filter((q) => solvedIds.has(q.id)).length };
  };

  // By topic
  const byTopic = TOPICS.map((topic) => {
    const subset = questions.filter((q) => q.topic === topic);
    return { topic, total: subset.length, solved: subset.filter((q) => solvedIds.has(q.id)).length };
  });

  // Achievements (same 13 rules as storage.ts)
  const easySolved = countByDiff("Easy").solved;
  const medSolved = countByDiff("Medium").solved;
  const hardSolved = countByDiff("Hard").solved;
  const topicCount = (t: Topic) => byTopic.find((b) => b.topic === t)?.solved ?? 0;

  const achievements: Achievement[] = [
    { id: "first-steps", name: "First Steps", desc: "Solve your first problem", icon: "🎯", unlocked: totalSolved >= 1 },
    { id: "easy-street", name: "Easy Street", desc: "Solve all 25 Easy problems", icon: "🟢", unlocked: easySolved >= 25 },
    { id: "medium-mastery", name: "Medium Mastery", desc: "Solve all 25 Medium problems", icon: "🟡", unlocked: medSolved >= 25 },
    { id: "hard-hitter", name: "Hard Hitter", desc: "Solve 10 Hard problems", icon: "💪", unlocked: hardSolved >= 10 },
    { id: "unstoppable", name: "Unstoppable", desc: "Solve all 25 Hard problems", icon: "🔴", unlocked: hardSolved >= 25 },
    { id: "halfway", name: "Halfway There", desc: "Solve 50% of all problems", icon: "⭐", unlocked: totalSolved >= 38 },
    { id: "perfectionist", name: "Perfectionist", desc: "Solve all 75 problems", icon: "👑", unlocked: totalSolved >= 75 },
    { id: "join-guru", name: "JOIN Guru", desc: "Complete all Aggregations & JOINs", icon: "🔗", unlocked: topicCount("Aggregations & JOINs") >= 15 },
    { id: "window-master", name: "Window Master", desc: "Complete all Window Functions", icon: "🪟", unlocked: topicCount("Window Functions") >= 15 },
    { id: "cumulative-pro", name: "Cumulative Pro", desc: "Complete all Cumulative & Sliding Windows", icon: "📈", unlocked: topicCount("Cumulative & Sliding Windows") >= 15 },
    { id: "sequence-detective", name: "Sequence Detective", desc: "Complete all Consecutive Sequences", icon: "🔍", unlocked: topicCount("Consecutive Sequences") >= 15 },
    { id: "analytics-ace", name: "Analytics Ace", desc: "Complete all Advanced Analytics", icon: "🧠", unlocked: topicCount("Advanced Analytics") >= 15 },
    { id: "streak-7", name: "Week Warrior", desc: "Solve problems on 7 different days", icon: "🔥", unlocked: uniqueDates.length >= 7 },
  ];

  const memberSince = solvedDates.length > 0
    ? [...solvedDates].sort()[0]
    : null;

  return {
    totalSolved,
    completionPercent,
    streak,
    activeDays: uniqueDates.length,
    byDifficulty: {
      Easy: countByDiff("Easy"),
      Medium: countByDiff("Medium"),
      Hard: countByDiff("Hard"),
    },
    byTopic,
    achievements,
    memberSince,
  };
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add lib/profile.ts
git commit -m "feat: add profile helpers, types, and stats computation from Supabase"
```

---

### Task 2: Create the profile page UI components

**Files:**
- Create: `components/profile/profile-header.tsx`
- Create: `components/profile/share-controls.tsx`
- Create: `components/profile/edit-display-name.tsx`

**Interfaces:**
- Consumes: `UserProfile`, `ProfileStats`, `getAnonymousName` from `lib/profile.ts`; `AuthUser` from `hooks/use-auth.ts`; existing components `StatsCards`, `ProgressBars`, `SkillRadar`, `Achievements`
- Produces:
  - `<ProfileHeader displayName={string} avatarUrl={string|null} memberSince={string|null} isOwner={boolean} />` — header card with avatar, name, date
  - `<ShareControls userId={string} shareToken={string|null} onTokenChange={(token: string|null) => void} />` — share/copy/revoke buttons
  - `<EditDisplayName userId={string} currentName={string|null} onSave={(name: string) => void} />` — inline edit form

- [ ] **Step 1: Create components/profile/profile-header.tsx**

```tsx
"use client";

import { User } from "lucide-react";

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isOwner: boolean;
}

export function ProfileHeader({ displayName, avatarUrl, memberSince }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-16 w-16 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">{displayName}</h1>
        {memberSince && (
          <p className="text-sm text-muted-foreground">
            Member since {new Date(memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create components/profile/share-controls.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateShareToken, revokeShareToken } from "@/lib/profile";
import { Copy, Check, Link2, Unlink } from "lucide-react";

interface ShareControlsProps {
  userId: string;
  shareToken: string | null;
  onTokenChange: (token: string | null) => void;
}

export function ShareControls({ userId, shareToken, onTokenChange }: ShareControlsProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const basePath = typeof window !== "undefined" ? window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || "") : "";
  const shareUrl = shareToken ? `${basePath}/profile/?share=${shareToken}` : null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const token = await generateShareToken(userId);
      onTokenChange(token);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true);
    try {
      await revokeShareToken(userId);
      onTokenChange(null);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!shareToken) {
    return (
      <Button onClick={handleGenerate} disabled={loading} size="sm" className="rounded-full">
        <Link2 className="mr-2 h-4 w-4" />
        {loading ? "Generating..." : "Share My Profile"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm">
        <span className="truncate max-w-[240px]">{shareUrl}</span>
        <button onClick={handleCopy} className="shrink-0 text-muted-foreground hover:text-foreground">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={loading} variant="outline" size="sm" className="rounded-full">
          Regenerate
        </Button>
        <Button onClick={handleRevoke} disabled={loading} variant="outline" size="sm" className="rounded-full">
          <Unlink className="mr-1 h-3 w-3" />
          Revoke
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create components/profile/edit-display-name.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { upsertDisplayName } from "@/lib/profile";

interface EditDisplayNameProps {
  userId: string;
  currentName: string | null;
  onSave: (name: string) => void;
}

export function EditDisplayName({ userId, currentName, onSave }: EditDisplayNameProps) {
  const [name, setName] = useState(currentName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertDisplayName(userId, name);
      onSave(name.trim().slice(0, 30));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium shrink-0">Display Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        placeholder="Anonymous"
        className="rounded-lg border bg-background px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button onClick={handleSave} disabled={saving} size="sm" variant="outline" className="rounded-full">
        {saved ? "Saved!" : saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add components/profile/
git commit -m "feat: add profile UI components — header, share controls, display name editor"
```

---

### Task 3: Create the profile page

**Files:**
- Create: `app/profile/page.tsx`
- Create: `app/profile/profile-client.tsx`

**Interfaces:**
- Consumes: `getProfileByToken`, `getProfileByUserId`, `computeProfileStats`, `getAnonymousName`, `UserProfile`, `ProfileStats` from `lib/profile.ts`; `useAuth` from `hooks/use-auth.ts`; `ProfileHeader`, `ShareControls`, `EditDisplayName` from `components/profile/`; `StatsCards` from `components/progress/stats-cards`; `ProgressBars` from `components/progress/progress-bars`; `SkillRadar` from `components/progress/skill-radar`; `Achievements` from `components/progress/achievements`
- Produces: `/profile/` page — shows own profile when logged in, shared profile when `?share=<token>` is present

- [ ] **Step 1: Create app/profile/page.tsx**

```tsx
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return <ProfileClient />;
}
```

- [ ] **Step 2: Create app/profile/profile-client.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  getProfileByToken,
  getProfileByUserId,
  computeProfileStats,
  getAnonymousName,
  type UserProfile,
  type ProfileStats,
} from "@/lib/profile";
import { TOPICS } from "@/lib/constants";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ShareControls } from "@/components/profile/share-controls";
import { EditDisplayName } from "@/components/profile/edit-display-name";
import { StatsCards } from "@/components/progress/stats-cards";
import { ProgressBars } from "@/components/progress/progress-bars";
import { SkillRadar } from "@/components/progress/skill-radar";
import { Achievements } from "@/components/progress/achievements";
import Link from "next/link";

type PageState =
  | { kind: "loading" }
  | { kind: "private" }
  | { kind: "invalid" }
  | { kind: "not-logged-in" }
  | { kind: "ready"; profile: UserProfile; stats: ProfileStats; isOwner: boolean; avatarUrl: string | null };

export function ProfileClient() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share");

  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      // Case 1: Shared profile via token
      if (shareToken) {
        const result = await getProfileByToken(shareToken);
        if (!result) {
          setState({ kind: "invalid" });
          return;
        }
        const isOwner = user?.id === result.profile.user_id;
        setDisplayName(result.profile.display_name);
        setCurrentToken(result.profile.share_token);
        setState({
          kind: "ready",
          profile: result.profile,
          stats: result.stats,
          isOwner,
          avatarUrl: isOwner ? user?.avatar ?? null : null,
        });
        return;
      }

      // Case 2: Own profile (no share token)
      if (!user) {
        setState({ kind: "not-logged-in" });
        return;
      }

      const profile = await getProfileByUserId(user.id);
      const stats = await computeProfileStats(user.id);
      const p = profile || { user_id: user.id, display_name: null, share_token: null, created_at: "", updated_at: "" };
      setDisplayName(p.display_name);
      setCurrentToken(p.share_token);
      setState({
        kind: "ready",
        profile: p,
        stats,
        isOwner: true,
        avatarUrl: user.avatar,
      });
    }

    load();
  }, [authLoading, user, shareToken]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (state.kind === "not-logged-in") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
        <p className="text-muted-foreground">
          Create an account to track progress and share your stats.
        </p>
        <Link href="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  if (state.kind === "private") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">This profile is private</h1>
        <Link href="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  if (state.kind === "invalid") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">This link is no longer valid</h1>
        <p className="text-muted-foreground">The profile owner may have revoked sharing.</p>
        <Link href="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  const { stats, isOwner, avatarUrl } = state;
  const name = displayName || getAnonymousName(state.profile.user_id);
  const totalQuestions = 75;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProfileHeader
            displayName={name}
            avatarUrl={avatarUrl}
            memberSince={stats.memberSince}
            isOwner={isOwner}
          />
          {isOwner && (
            <ShareControls
              userId={state.profile.user_id}
              shareToken={currentToken}
              onTokenChange={setCurrentToken}
            />
          )}
        </div>

        {/* Edit display name (owner only) */}
        {isOwner && (
          <EditDisplayName
            userId={state.profile.user_id}
            currentName={displayName}
            onSave={setDisplayName}
          />
        )}

        {/* Stats */}
        <StatsCards
          totalSolved={stats.totalSolved}
          totalQuestions={totalQuestions}
          completionPercent={stats.completionPercent}
          streak={stats.streak}
        />

        <ProgressBars
          byDifficulty={stats.byDifficulty}
          byTopic={stats.byTopic}
        />

        <div>
          <h3 className="mb-4 font-semibold">Skill Radar</h3>
          <SkillRadar byTopic={stats.byTopic} />
        </div>

        <Achievements achievements={stats.achievements} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/profile/
git commit -m "feat: add profile page with shared/owner views and sharing controls"
```

---

### Task 4: Create the downloadable share card (canvas renderer)

**Files:**
- Create: `components/profile/share-card.tsx`
- Modify: `app/profile/profile-client.tsx` — add download button

**Interfaces:**
- Consumes: `ProfileStats` from `lib/profile.ts`; `DIFFICULTY_COLORS`, `TOPIC_COLORS` from `lib/constants.ts`
- Produces: `<ShareCardButton displayName={string} stats={ProfileStats} />` — renders a button that generates a canvas-based PNG and triggers download

- [ ] **Step 1: Create components/profile/share-card.tsx**

```tsx
"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ProfileStats } from "@/lib/profile";

interface ShareCardButtonProps {
  displayName: string;
  stats: ProfileStats;
}

function drawCard(canvas: HTMLCanvasElement, displayName: string, stats: ProfileStats) {
  const ctx = canvas.getContext("2d")!;
  const W = 1200;
  const H = 630;
  canvas.width = W;
  canvas.height = H;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Branding
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("QueryVeda", 60, 56);

  // Display name
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.fillText(displayName, 60, 120);

  // Member since
  if (stats.memberSince) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px system-ui, sans-serif";
    const d = new Date(stats.memberSince);
    ctx.fillText(`Member since ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, 60, 152);
  }

  // Big stats row
  const statItems = [
    { label: "Solved", value: `${stats.totalSolved}/75` },
    { label: "Completion", value: `${stats.completionPercent}%` },
    { label: "Streak", value: `${stats.streak} days` },
    { label: "Active Days", value: `${stats.activeDays}` },
  ];
  let sx = 60;
  for (const item of statItems) {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.fillText(item.value, sx, 230);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(item.label, sx, 256);
    sx += 240;
  }

  // Difficulty bars
  const diffs = [
    { label: "Easy", ...stats.byDifficulty.Easy, color: "#22c55e" },
    { label: "Medium", ...stats.byDifficulty.Medium, color: "#f59e0b" },
    { label: "Hard", ...stats.byDifficulty.Hard, color: "#ef4444" },
  ];
  let dy = 310;
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Difficulty", 60, dy);
  dy += 30;
  for (const d of diffs) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`${d.label}  ${d.solved}/${d.total}`, 60, dy);
    // Bar background
    ctx.fillStyle = "#334155";
    ctx.fillRect(220, dy - 12, 300, 14);
    // Bar fill
    const pct = d.total > 0 ? d.solved / d.total : 0;
    ctx.fillStyle = d.color;
    ctx.fillRect(220, dy - 12, 300 * pct, 14);
    dy += 30;
  }

  // Topic mastery bars
  const topicColors: Record<string, string> = {
    "Aggregations & JOINs": "#7C3AED",
    "Window Functions": "#8b5cf6",
    "Cumulative & Sliding Windows": "#06b6d4",
    "Consecutive Sequences": "#f59e0b",
    "Advanced Analytics": "#ec4899",
  };
  const shortLabels: Record<string, string> = {
    "Aggregations & JOINs": "JOINs",
    "Window Functions": "Windows",
    "Cumulative & Sliding Windows": "Cumulative",
    "Consecutive Sequences": "Sequences",
    "Advanced Analytics": "Analytics",
  };
  let ty = 310;
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Topics", 620, ty);
  ty += 30;
  for (const t of stats.byTopic) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`${shortLabels[t.topic] ?? t.topic}  ${t.solved}/${t.total}`, 620, ty);
    ctx.fillStyle = "#334155";
    ctx.fillRect(800, ty - 12, 300, 14);
    const pct = t.total > 0 ? t.solved / t.total : 0;
    ctx.fillStyle = topicColors[t.topic] ?? "#8b5cf6";
    ctx.fillRect(800, ty - 12, 300 * pct, 14);
    ty += 30;
  }

  // Achievements (bottom row — top 4 unlocked)
  const unlocked = stats.achievements.filter((a) => a.unlocked).slice(0, 4);
  if (unlocked.length > 0) {
    let ax = 60;
    const ay = 560;
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Achievements", 60, ay - 20);
    ctx.font = "14px system-ui, sans-serif";
    for (const a of unlocked) {
      // Pill background
      const text = `${a.icon} ${a.name}`;
      const tw = ctx.measureText(text).width + 24;
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ax, ay - 12, tw, 28, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(text, ax + 12, ay + 6);
      ax += tw + 12;
    }
  }
}

export function ShareCardButton({ displayName, stats }: ShareCardButtonProps) {
  const handleDownload = useCallback(() => {
    const canvas = document.createElement("canvas");
    drawCard(canvas, displayName, stats);
    const link = document.createElement("a");
    link.download = "queryveda-profile.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [displayName, stats]);

  return (
    <Button onClick={handleDownload} variant="outline" size="sm" className="rounded-full">
      <Download className="mr-2 h-4 w-4" />
      Download Card
    </Button>
  );
}
```

- [ ] **Step 2: Add ShareCardButton to the profile page**

In `app/profile/profile-client.tsx`, add the import at the top:

```typescript
import { ShareCardButton } from "@/components/profile/share-card";
```

Then add the button next to the ShareControls. Replace the `{/* Header */}` block:

```tsx
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProfileHeader
            displayName={name}
            avatarUrl={avatarUrl}
            memberSince={stats.memberSince}
            isOwner={isOwner}
          />
          <div className="flex flex-col gap-2 sm:items-end">
            {isOwner && (
              <ShareControls
                userId={state.profile.user_id}
                shareToken={currentToken}
                onTokenChange={setCurrentToken}
              />
            )}
            <ShareCardButton displayName={name} stats={stats} />
          </div>
        </div>
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Manual test**

1. Log in and navigate to `/profile/`
2. Verify own profile renders with stats, radar, achievements
3. Set a display name and verify it persists on refresh
4. Click "Share My Profile" — verify a URL is generated with `?share=<token>`
5. Copy the URL and open in an incognito window — verify the shared profile renders
6. Click "Download Card" — verify a PNG downloads with the card layout
7. Click "Revoke" — verify the shared URL no longer works in incognito
8. Test "Regenerate" — verify old links stop working, new one works

- [ ] **Step 5: Commit**

```bash
git add components/profile/share-card.tsx app/profile/profile-client.tsx
git commit -m "feat: add downloadable share card with canvas-based PNG generation"
```

---

### Task 5: Add profile link to navigation and progress page

**Files:**
- Modify: `components/layout/` — add Profile link to nav (find the nav component)
- Modify: `app/progress/page.tsx` — add "View My Profile" link at top

**Interfaces:**
- Consumes: `useAuth` from `hooks/use-auth.ts`
- Produces: Navigation link to `/profile/` visible when logged in

- [ ] **Step 1: Add Profile to navLinks in navbar**

In `components/layout/navbar.tsx`, the `navLinks` array is on lines 17-24. Add Profile after Leaderboard:

```typescript
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/daily", label: "Daily" },
  { href: "/problems", label: "Problems" },
  { href: "/progress", label: "Progress" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" },
];
```

Note: The Profile link is visible to all users in the nav. If not logged in, the profile page itself handles the redirect/message. This matches how Progress works (it's always in the nav but shows a login prompt via `ProtectedRoute`).

- [ ] **Step 2: Also add Profile to mobile-drawer.tsx**

Read `components/layout/mobile-drawer.tsx` and add the same Profile link there, matching the existing nav link pattern.

- [ ] **Step 3: Add "View My Profile" link to progress page**

In `app/progress/page.tsx`, after the `<h1>` tag (line 127), add:

```tsx
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Progress</h1>
        <Link href="/profile/" className="text-sm text-primary hover:underline">
          View My Profile
        </Link>
      </div>
```

And remove the existing standalone `<h1>` on line 127.

- [ ] **Step 4: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Manual test**

1. When logged in, verify "Profile" appears in the nav
2. When logged out, verify "Profile" is hidden from nav
3. On the progress page, verify "View My Profile" link appears and navigates correctly

- [ ] **Step 6: Commit**

```bash
git add components/layout/ app/progress/page.tsx
git commit -m "feat: add profile link to navigation and progress page"
```

---

### Task 6: Refactor leaderboard to use shared anonymous name function

**Files:**
- Modify: `app/leaderboard/page.tsx` — replace inline `ADJECTIVES`, `ANIMALS`, `hashCode`, `getUsername` with import from `lib/profile.ts`

**Interfaces:**
- Consumes: `getAnonymousName` from `lib/profile.ts`
- Produces: No new interfaces — cleanup only

- [ ] **Step 1: Update leaderboard imports**

In `app/leaderboard/page.tsx`, add the import:

```typescript
import { getAnonymousName } from "@/lib/profile";
```

- [ ] **Step 2: Remove duplicated code**

Remove lines 19-47 from `app/leaderboard/page.tsx` (the `ADJECTIVES`, `ANIMALS`, `hashCode`, and `getUsername` constants/functions).

- [ ] **Step 3: Update usage**

Replace `getUsername(row.user_id)` on line 178 with `getAnonymousName(row.user_id)`.

- [ ] **Step 4: Verify the build compiles**

Run: `cd /Users/saibal/Documents/projects/sql_compiler/queryveda && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/leaderboard/page.tsx
git commit -m "refactor: use shared getAnonymousName from lib/profile in leaderboard"
```
