"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User, Users, Search, Clock as ActivityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTotalSocialCountClient } from "@/lib/actions/socialCountsClient";
import { NotificationBadge } from "@/components/social/NotificationBadge";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Create",
    href: "/create",
    icon: Plus,
  },
  {
    name: "Browse",
    href: "/browse",
    icon: Search,
  },
  {
    name: "Social",
    href: "/social",
    icon: Users,
  },
  {
    name: "Activity",
    href: "/activity",
    icon: ActivityIcon,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [socialCount, setSocialCount] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadSocialCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const count = await getTotalSocialCountClient(user.id);
        setSocialCount(count);
      }
    }
    
    async function loadAchievementsCount() {
      try {
        const response = await fetch("/api/achievements-count");
        if (response.ok) {
          const data = await response.json();
          setAchievementsCount(data.count || 0);
        }
      } catch (err) {
        console.error("Error fetching achievements count:", err);
      }
    }

    loadSocialCount();
    loadAchievementsCount();

    // Refresh counts periodically (every 30 seconds)
    const interval = setInterval(() => {
      loadSocialCount();
      loadAchievementsCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [supabase, pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showSocialBadge = item.href === "/social" && socialCount > 0;
          const showAchievementsBadge = item.href === "/profile" && achievementsCount > 0;
          const showBadge = showSocialBadge || showAchievementsBadge;
          const badgeCount = showSocialBadge ? socialCount : showAchievementsBadge ? achievementsCount : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors relative",
                "active:bg-accent active:text-accent-foreground",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex items-center">
                {item.name}
                {showBadge && (
                  <NotificationBadge count={badgeCount} className="ml-1.5 h-4 text-[10px] px-1.5" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


