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
import { questions } from "@/lib/questions";
import { ShareControls } from "@/components/profile/share-controls";
import { ShareCardButton } from "@/components/profile/share-card";
import { EditDisplayName } from "@/components/profile/edit-display-name";
import Link from "next/link";

type PageState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error" }
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
      try {
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
          avatarUrl: user.avatar ?? null,
        });
      } catch {
        setState({ kind: "error" });
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, user?.avatar, shareToken]);

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

  if (state.kind === "invalid") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">This link is no longer valid</h1>
        <p className="text-muted-foreground">The profile owner may have revoked sharing.</p>
        <Link href="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">Something went wrong. Please try again later.</p>
        <Link href="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  const { stats, isOwner, avatarUrl } = state;
  const name = displayName || getAnonymousName(state.profile.user_id);
  const totalQuestions = questions.length;

  const sqlUnlocked = stats.achievements.filter((a) => a.unlocked);
  const excelUnlocked = stats.excelStats.achievements.filter((a) => a.unlocked);
  const allUnlocked = [...sqlUnlocked, ...excelUnlocked];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero card — identity + stats only */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-background to-muted/30 p-6 sm:p-8 mb-4">
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            {stats.memberSince && (
              <p className="text-sm text-muted-foreground">
                Member since {new Date(stats.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          <StatPill label="Solved" value={`${stats.totalSolved}/${totalQuestions}`} />
          <StatPill label="Completion" value={`${stats.completionPercent}%`} />
          <StatPill label="Streak" value={`${stats.streak}d`} />
          <StatPill label="Active Days" value={`${stats.activeDays}`} />
          <StatPill label="Achievements" value={`${allUnlocked.length}`} />
        </div>
      </div>

      {/* Actions bar — edit, share, download */}
      {isOwner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings &amp; Sharing</h2>
          <EditDisplayName
            userId={state.profile.user_id}
            currentName={displayName}
            onSave={setDisplayName}
          />
          <div className="flex flex-wrap items-center gap-3">
            <ShareControls
              userId={state.profile.user_id}
              shareToken={currentToken}
              onTokenChange={setCurrentToken}
            />
            <ShareCardButton displayName={name} stats={stats} />
          </div>
        </div>
      )}
      {!isOwner && (
        <div className="mb-6 flex justify-end">
          <ShareCardButton displayName={name} stats={stats} />
        </div>
      )}

      {/* Two-column: SQL + Excel summaries */}
      <div className="grid gap-6 sm:grid-cols-2 mb-6">
        {/* SQL Summary */}
        <div className="rounded-xl border border-primary/20 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">SQL Practice</h2>
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-bold">{stats.totalSolved}</span>
              <span className="text-sm text-muted-foreground">/ {totalQuestions} problems</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.completionPercent}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {(["Easy", "Medium", "Hard"] as const).map((d) => {
              const { solved, total } = stats.byDifficulty[d];
              const pct = total > 0 ? (solved / total) * 100 : 0;
              const colors = { Easy: "bg-green-500", Medium: "bg-yellow-500", Hard: "bg-red-500" };
              return (
                <div key={d} className="flex items-center gap-2 text-sm">
                  <span className="w-16 text-muted-foreground">{d}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${colors[d]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{solved}/{total}</span>
                </div>
              );
            })}
          </div>
          {stats.byTopic.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {stats.byTopic.map((t) => {
                const pct = t.total > 0 ? (t.solved / t.total) * 100 : 0;
                const short: Record<string, string> = {
                  "Aggregations & JOINs": "JOINs",
                  "Window Functions": "Windows",
                  "Cumulative & Sliding Windows": "Cumulative",
                  "Consecutive Sequences": "Sequences",
                  "Advanced Analytics": "Analytics",
                };
                return (
                  <div key={t.topic} className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-muted-foreground truncate">{short[t.topic] ?? t.topic}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{t.solved}/{t.total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Excel Summary */}
        <div className="rounded-xl border border-primary/20 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Excel Skills</h2>
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-bold">{stats.excelStats.totalCompleted}</span>
              <span className="text-sm text-muted-foreground">/ {stats.excelStats.totalItems} items</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${stats.excelStats.totalItems > 0 ? Math.round((stats.excelStats.totalCompleted / stats.excelStats.totalItems) * 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {stats.excelStats.nodeMasteries.map((m) => {
              const pct = m.total > 0 ? (m.completed / m.total) * 100 : 0;
              return (
                <div key={m.nodeId} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-muted-foreground truncate" title={m.title}>
                    {m.title.split("&")[0].trim()}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{m.completed}/{m.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievements — compact grid */}
      {allUnlocked.length > 0 && (
        <div className="rounded-xl border border-primary/20 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Achievements Earned ({allUnlocked.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {allUnlocked.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm"
                title={a.desc}
              >
                <span>{a.icon}</span>
                <span className="font-medium">{a.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-1.5">
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
