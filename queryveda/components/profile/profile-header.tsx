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
