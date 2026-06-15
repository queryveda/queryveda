"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthContext, type AuthUser } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.full_name || meta.name || user.email?.split("@")[0] || "User",
    email: user.email,
    avatar: meta.avatar_url || meta.picture || null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setRawUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        storage.syncLocalToCloud(session.user.id).then(() =>
          storage.syncFromCloud(session.user.id)
        );
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setRawUser(session?.user ?? null);
      if (session?.user) {
        storage.syncLocalToCloud(session.user.id).then(() =>
          storage.syncFromCloud(session.user.id)
        );
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) return { ok: false, msg: "Email and password are required." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, msg: error.message };
    return { ok: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    if (!name || !email || !password) return { ok: false, msg: "All fields are required." };
    if (password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { ok: false, msg: error.message };
    if (data.user && !data.session) return { ok: true, msg: "Check your email to confirm your account." };
    return { ok: true };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/",
      },
    });
  }, []);

  const loginWithLinkedIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo:
          window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/",
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: toAuthUser(rawUser),
        rawUser,
        loading,
        login,
        signup,
        loginWithGoogle,
        loginWithLinkedIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
