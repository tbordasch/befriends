"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User, Users, Search, Clock as ActivityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { PointsDisplay } from "@/components/points/PointsDisplay";
import { getLockedPointsClient, getPotentialWinClient } from "@/lib/actions/pointsClient";
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

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<any>(null);
  const [lockedPoints, setLockedPoints] = useState(0);
  const [potentialWin, setPotentialWin] = useState(0);
  const [socialCount, setSocialCount] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        if (data) {
          setProfile(data);

          // Calculate locked points using the client function
          const locked = await getLockedPointsClient(currentUser.id);
          setLockedPoints(locked);
          
          // Calculate potential win
          const potential = await getPotentialWinClient(currentUser.id);
          setPotentialWin(potential);

          // Get social count
          const social = await getTotalSocialCountClient(currentUser.id);
          setSocialCount(social);

          // Get new achievements count from API
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
      } else {
        // Reset points if no user
        setLockedPoints(0);
        setPotentialWin(0);
        setSocialCount(0);
        setAchievementsCount(0);
      }
    }
    loadProfile();

    // Refresh social count periodically (every 30 seconds)
    const interval = setInterval(async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        const social = await getTotalSocialCountClient(currentUser.id);
        setSocialCount(social);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [supabase, pathname]); // Reload when pathname changes (e.g., after bet deletion)

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0">
      <div className="flex flex-col flex-grow border-r border-sidebar-border bg-sidebar pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            BetFriends
          </h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
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
                  "flex items-center min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-colors relative",
                  "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex items-center flex-1">
                  {item.name}
                  {showBadge && (
                    <NotificationBadge count={badgeCount} className="ml-2" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
        
        {/* Points Display & User Menu - Only show if logged in */}
        {user && profile && (
          <div className="px-3 pt-4 border-t border-sidebar-border mt-auto space-y-2">
                  <PointsDisplay
                    available={profile.current_points || 0}
                    locked={lockedPoints}
                    potentialWin={potentialWin}
                    variant="sidebar"
                  />
            <UserMenu />
          </div>
        )}
      </div>
    </aside>
  );
}


