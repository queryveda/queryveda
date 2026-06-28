import { Sidebar } from "./sidebar";
import { MobileDock } from "./mobile-dock";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="lg:ml-16 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
      <MobileDock />
    </>
  );
}
