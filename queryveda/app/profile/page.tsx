import { Suspense } from "react";
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileClient />
    </Suspense>
  );
}
