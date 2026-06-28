import { HomeRedirectGuard } from "@/components/home/home-client";
import { BentoDashboard } from "@/components/home/bento-dashboard";
import { DailyToast } from "@/components/daily/daily-toast";

export default function Home() {
  return (
    <HomeRedirectGuard>
      <BentoDashboard />
      <DailyToast />
    </HomeRedirectGuard>
  );
}
