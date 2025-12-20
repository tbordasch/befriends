"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserBettingStats } from "./stats";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string; // When was this achievement unlocked
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const supabase = await createClient();
  const stats = await getUserBettingStats(userId);

  const achievements: Achievement[] = [];

  // First Bet Achievement
  const { data: firstBet } = await supabase
    .from("bet_participants")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  achievements.push({
    id: "first_bet",
    name: "First Bet",
    description: "Place your first bet",
    icon: "🎯",
    unlocked: !!firstBet,
    unlockedAt: firstBet?.created_at,
  });

  // 3 Wins Achievement
  achievements.push({
    id: "three_wins",
    name: "Triple Winner",
    description: "Win 3 bets",
    icon: "🏆",
    unlocked: stats.wins >= 3,
    progress: stats.wins,
    maxProgress: 3,
    // For progress achievements, we can't easily determine exact unlock time
    // But we can check when user reached 3 wins
    unlockedAt: stats.wins >= 3 ? undefined : undefined, // Would need to track this properly
  });

  // 10 Wins Achievement
  achievements.push({
    id: "ten_wins",
    name: "Decade Winner",
    description: "Win 10 bets",
    icon: "👑",
    unlocked: stats.wins >= 10,
    progress: stats.wins,
    maxProgress: 10,
  });

  // High Roller Achievement (5000+ stake)
  const { data: allParticipants } = await supabase
    .from("bet_participants")
    .select(
      `
      bet_id,
      created_at,
      bet:bets!inner(
        id,
        stake_amount
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: true });

  const highRollerBet = allParticipants?.find(
    (p: any) => p.bet?.stake_amount >= 5000
  );

  achievements.push({
    id: "high_roller",
    name: "High Roller",
    description: "Place a bet with 5000+ points stake",
    icon: "💰",
    unlocked: !!highRollerBet,
    unlockedAt: highRollerBet?.created_at,
  });

  // Maximum Roller Achievement (10000+ stake)
  const maxRollerBet = allParticipants?.find(
    (p: any) => p.bet?.stake_amount >= 10000
  );

  achievements.push({
    id: "maximum_roller",
    name: "Maximum Roller",
    description: "Place a bet with 10000+ points stake",
    icon: "💎",
    unlocked: !!maxRollerBet,
    unlockedAt: maxRollerBet?.created_at,
  });

  // Social Butterfly Achievement (5+ friends)
  const { data: friends } = await supabase
    .from("friends")
    .select("id, user_id, friend_id, created_at")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .order("created_at", { ascending: true });

  // Count unique friends (check both directions)
  const uniqueFriendIds = new Set<string>();
  let fifthFriendCreatedAt: string | undefined;
  let friendCount = 0;
  friends?.forEach((friend) => {
    const friendId = friend.user_id === userId ? friend.friend_id : friend.user_id;
    if (!uniqueFriendIds.has(friendId)) {
      uniqueFriendIds.add(friendId);
      friendCount++;
      if (friendCount === 5) {
        fifthFriendCreatedAt = friend.created_at;
      }
    }
  });

  achievements.push({
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Have 5 or more friends",
    icon: "🦋",
    unlocked: friendCount >= 5,
    progress: friendCount,
    maxProgress: 5,
    unlockedAt: fifthFriendCreatedAt,
  });

  return achievements;
}

/**
 * Get count of new achievements (unlocked since last view)
 */
export async function getNewAchievementsCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get user's last viewed timestamp
  const { data: profile } = await supabase
    .from("profiles")
    .select("achievements_last_viewed_at")
    .eq("id", userId)
    .single();

  if (!profile?.achievements_last_viewed_at) {
    // If never viewed, check if user has any achievements
    const achievements = await getUserAchievements(userId);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    return unlockedCount > 0 ? 1 : 0; // Show notification if any achievements exist
  }

  const lastViewed = new Date(profile.achievements_last_viewed_at);
  const achievements = await getUserAchievements(userId);

  // Count achievements unlocked after last view
  let newCount = 0;
  for (const achievement of achievements) {
    if (achievement.unlocked && achievement.unlockedAt) {
      const unlockedAt = new Date(achievement.unlockedAt);
      if (unlockedAt > lastViewed) {
        newCount++;
      }
    }
  }

  return newCount;
}
