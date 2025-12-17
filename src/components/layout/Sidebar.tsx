"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { PointsDisplay } from "@/components/points/PointsDisplay";
import { getLockedPointsClient, getPotentialWinClient } from "@/lib/actions/pointsClient";

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
        }
      } else {
        // Reset points if no user
        setLockedPoints(0);
        setPotentialWin(0);
      }
    }
    loadProfile();
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

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
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


