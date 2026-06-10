"use client";

import { useProtection } from "@/hooks/use-protection";

export function ProtectionWrapper() {
  useProtection();
  return null;
}
