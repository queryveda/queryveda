"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth-modal";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!user)
    return (
      <>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-bold">Sign in to view your progress</h2>
          <p className="text-muted-foreground">
            Track your solved problems, streaks, and achievements.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Sign In
          </button>
        </div>
        <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      </>
    );

  return <>{children}</>;
}
