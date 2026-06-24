import { Suspense } from "react";
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <ProfileClient />
    </Suspense>
  );
}
