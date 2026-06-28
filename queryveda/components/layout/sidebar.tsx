"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTrack } from "@/hooks/use-track";
import { useDailyStatus } from "@/hooks/use-daily-status";
import { useTourState } from "@/hooks/use-tour-state";
import { ThemeToggle } from "./theme-toggle";
import { AuthModal } from "@/components/auth/auth-modal";
import {
  Home,
  BookOpen,
  Table2,
  Zap,
  ClipboardList,
  BarChart3,
  Trophy,
  User,
  HelpCircle,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn SQL", icon: BookOpen, track: "sql" as const },
  { href: "/excel", label: "Learn Excel", icon: Table2, track: "excel" as const },
  { href: "/daily", label: "Daily", icon: Zap, hasBadge: true },
  { href: "/problems", label: "Problems", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { hasTrack } = useTrack();
  const { hasUnattempted } = useDailyStatus();
  const { reset: resetTour } = useTourState();
  const [expanded, setExpanded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Hide sidebar on shared profile view
  if (pathname === "/profile" && searchParams.has("share")) return null;

  // On practice page, disable hover expand
  const isPracticePage = pathname.startsWith("/practice/");

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const filteredNav = mainNav.filter(({ track }) => {
    if (!track) return true;
    return hasTrack(track);
  });

  return (
    <>
      <aside
        onMouseEnter={() => !isPracticePage && setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed left-0 top-0 z-50 hidden lg:flex flex-col h-screen border-r border-border bg-card/95 backdrop-blur-sm transition-[width] duration-200 ease-out ${
          expanded ? "w-[220px]" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 shrink-0">
          <Link href="/" className="flex items-center gap-3 font-bold text-lg tracking-tight overflow-hidden">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
              QV
            </span>
            <span
              className={`whitespace-nowrap transition-opacity duration-150 ${
                expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
              }`}
            >
              QueryVeda
            </span>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 flex flex-col gap-1 px-2 py-2 overflow-y-auto">
          {filteredNav.map(({ href, label, icon: Icon, hasBadge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? label : undefined}
                className={`relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary" />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-150 ${
                    expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
                  }`}
                >
                  {label}
                </span>
                {/* Daily unattempted badge */}
                {hasBadge && hasUnattempted && !active && (
                  <span className="absolute top-1.5 left-8 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col gap-1 px-2 py-3 border-t border-border shrink-0">
          {/* Profile / Auth */}
          {user ? (
            <Link
              href="/profile"
              title={!expanded ? user.name : undefined}
              className={`flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                isActive("/profile")
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} width={20} height={20} className="rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`whitespace-nowrap truncate transition-opacity duration-150 ${
                  expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
                }`}
              >
                {user.name}
              </span>
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              title={!expanded ? "Sign In" : undefined}
              className="flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors overflow-hidden"
            >
              <User className="w-5 h-5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-opacity duration-150 ${
                  expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
                }`}
              >
                Sign In
              </span>
            </button>
          )}

          {/* Help / Tour */}
          <button
            onClick={() => {
              resetTour();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("queryveda:start-tour"));
              }, 100);
            }}
            title={!expanded ? "Take a tour" : undefined}
            className="flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors overflow-hidden"
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span
              className={`whitespace-nowrap transition-opacity duration-150 ${
                expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
              }`}
            >
              Help
            </span>
          </button>

          {/* Theme toggle */}
          <div className="flex items-center gap-3 h-10 px-3 overflow-hidden">
            <ThemeToggle />
            <span
              className={`whitespace-nowrap text-sm text-muted-foreground transition-opacity duration-150 ${
                expanded ? "opacity-100 delay-[50ms]" : "opacity-0"
              }`}
            >
              Theme
            </span>
          </div>
        </div>
      </aside>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense>
      <SidebarContent />
    </Suspense>
  );
}
