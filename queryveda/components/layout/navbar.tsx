"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useDailyStatus } from "@/hooks/use-daily-status";
import { useTrack } from "@/hooks/use-track";
import { ThemeToggle } from "./theme-toggle";
import { MobileDrawer } from "./mobile-drawer";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import { ChevronDown, BookOpen, Table2, Check, HelpCircle } from "lucide-react";
import { useTourState } from "@/hooks/use-tour-state";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/daily", label: "Daily" },
  { href: "/problems", label: "Problems" },
  { href: "/progress", label: "Progress" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
];

const learnTracks = [
  { href: "/learn", label: "SQL", track: "sql" as const, icon: BookOpen },
  { href: "/excel", label: "Excel", track: "excel" as const, icon: Table2 },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasTrack } = useTrack();
  const { hasUnattempted } = useDailyStatus();
  const { reset: resetTour } = useTourState();
  const [authOpen, setAuthOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const learnRef = useRef<HTMLDivElement>(null);

  const isLearnActive =
    pathname.startsWith("/learn") || pathname.startsWith("/excel");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) {
        setLearnOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-3">
              <MobileDrawer />

              {/* Logo */}
              <Link
                href="/"
                className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
              >
                QueryVeda
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden lg:flex items-center gap-1 ml-4">
                {navLinks.map(({ href, label }) => {
                  const isActive =
                    href === "/"
                      ? pathname === "/"
                      : pathname === href || pathname.startsWith(href + "/");

                  // Insert Learn dropdown after Home
                  if (href === "/") {
                    return (
                      <span key="home-and-learn" className="contents">
                        <Link
                          href="/"
                          className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            pathname === "/"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                        >
                          Home
                        </Link>

                        {/* Learn dropdown */}
                        <div ref={learnRef} className="relative" data-tour="learn">
                          <button
                            onClick={() => setLearnOpen((o) => !o)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isLearnActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                          >
                            Learn
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${learnOpen ? "rotate-180" : ""}`} />
                          </button>
                          {learnOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border bg-popover p-1 shadow-lg z-50">
                              {learnTracks.map(({ href: trackHref, label: trackLabel, track, icon: Icon }) => {
                                const selected = hasTrack(track);
                                const active = pathname.startsWith(trackHref);
                                return (
                                  <Link
                                    key={track}
                                    href={trackHref}
                                    onClick={() => setLearnOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                      active
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-foreground hover:bg-accent"
                                    }`}
                                  >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{trackLabel}</span>
                                    {selected && (
                                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      data-tour={label.toLowerCase()}
                      className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {label}
                      {label === "Daily" && hasUnattempted && !isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
              <div data-tour="theme-toggle">
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  resetTour();
                  // Small delay so state resets before PlatformTour picks it up
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("queryveda:start-tour"));
                  }, 100);
                }}
                aria-label="Take a tour"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>

              {user ? (
                <div className="flex items-center gap-2">
                  {/* Avatar */}
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground select-none">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name — hidden on small screens */}
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Log out
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setAuthOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
