"use client";

import { useContext, createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  name: string;
  email: string | undefined;
  avatar: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  rawUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; msg?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; msg?: string }>;
  loginWithGoogle: () => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
