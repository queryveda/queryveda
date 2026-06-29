"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTrack } from "@/hooks/use-track";
import { Home, BookOpen, Zap, ClipboardList, BarChart3, User } from "lucide-react";

const dockItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/daily", label: "Daily", icon: Zap },
  { href: "/problems", label: "Problems", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/profile", label: "Me", icon: User },
];

function MobileDockContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasTrack } = useTrack();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide on shared profile view
  if (pathname === "/profile" && searchParams.has("share")) return null;

  // Hide on practice IDE page
  if (pathname.startsWith("/practice/")) return null;

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  // "Learn" item should go to the user's selected track
  const getHref = (href: string) => {
    if (href === "/learn") {
      return hasTrack("excel") && !hasTrack("sql") ? "/excel" : "/learn";
    }
    return href;
  };

  return (
    <div
      className={`fixed bottom-3 left-4 right-4 z-50 lg:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-[calc(100%+24px)]"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="flex items-center justify-around h-14 rounded-full bg-background/70 backdrop-blur-xl border border-border/50 shadow-lg">
        {dockItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const resolvedHref = getHref(href);
          return (
            <Link
              key={href}
              href={resolvedHref}
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 relative"
              aria-label={label}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {/* Active glow dot */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/50" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileDock() {
  return (
    <Suspense>
      <MobileDockContent />
    </Suspense>
  );
}
