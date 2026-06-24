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
