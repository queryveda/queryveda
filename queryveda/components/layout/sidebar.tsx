"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
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
  LogOut,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/daily", label: "Daily", icon: Zap, hasBadge: true, tour: "daily" },
  { href: "/problems", label: "Problems", icon: ClipboardList, tour: "problems" },
  { href: "/progress", label: "Progress", icon: BarChart3, tour: "progress" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, tour: "leaderboard" },
];

const learnTracks = [
  { href: "/learn", label: "SQL", icon: BookOpen },
  { href: "/excel", label: "Excel", icon: Table2 },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
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

  const isLearnActive = pathname.startsWith("/learn") || pathname.startsWith("/excel");

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
          {/* Home */}
          <Link
            href="/"
            title={!expanded ? "Home" : undefined}
            className={`relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
              pathname === "/" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {pathname === "/" && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary" />}
            <Home className="w-5 h-5 shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-150 ${expanded ? "opacity-100 delay-[50ms]" : "opacity-0"}`}>Home</span>
          </Link>

          {/* Learn section — expandable with SQL & Excel sub-items */}
          <div data-tour="learn">
            <button
              title={!expanded ? "Learn" : undefined}
              onClick={() => {
                // When collapsed, navigate to the first track
                if (!expanded) {
                  window.location.href = "/learn";
                }
              }}
              className={`relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden w-full text-left ${
                isLearnActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {isLearnActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary" />}
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-150 ${expanded ? "opacity-100 delay-[50ms]" : "opacity-0"}`}>Learn</span>
            </button>
            {/* Sub-items — only show when expanded */}
            {expanded && (
              <div className="ml-6 mt-0.5 flex flex-col gap-0.5">
                {learnTracks.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 h-8 px-3 rounded-lg text-sm transition-colors ${
                        active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rest of nav */}
          {mainNav.slice(1).map(({ href, label, icon: Icon, hasBadge, tour }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? label : undefined}
                data-tour={tour}
                className={`relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
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
            <>
              <Link
                href="/profile"
                title={!expanded ? user.name : undefined}
                data-tour="profile"
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
              {expanded && (
                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors overflow-hidden"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap">Sign Out</span>
                </button>
              )}
            </>
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
          <div data-tour="theme-toggle" className="flex items-center gap-3 h-10 px-3 overflow-hidden [&_button]:w-5 [&_button]:h-5 [&_button]:p-0 [&_button]:min-w-0">
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
