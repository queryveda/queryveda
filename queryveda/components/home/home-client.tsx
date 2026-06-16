"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrack } from "@/hooks/use-track";

export function HomeRedirectGuard({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, loading } = useTrack();
  const router = useRouter();

  useEffect(() => {
    if (!loading && needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, loading, router]);

  if (loading || needsOnboarding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
