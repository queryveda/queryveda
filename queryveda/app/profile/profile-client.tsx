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
        avatarUrl: user.avatar ?? null,
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
  const totalQuestions = questions.length;

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
