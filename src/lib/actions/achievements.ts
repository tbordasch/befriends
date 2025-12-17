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
    .select("id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .limit(1)
    .single();

  achievements.push({
    id: "first_bet",
    name: "First Bet",
    description: "Place your first bet",
    icon: "🎯",
    unlocked: !!firstBet,
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
  // First get all bets where user participated
  const { data: allParticipants } = await supabase
    .from("bet_participants")
    .select(
      `
      bet_id,
      bet:bets!inner(
        id,
        stake_amount
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "accepted");

  const hasHighRollerBet = allParticipants?.some(
    (p: any) => p.bet?.stake_amount >= 5000
  ) || false;

  achievements.push({
    id: "high_roller",
    name: "High Roller",
    description: "Place a bet with 5000+ points stake",
    icon: "💰",
    unlocked: hasHighRollerBet,
  });

  // Maximum Roller Achievement (10000+ stake)
  const hasMaxRollerBet = allParticipants?.some(
    (p: any) => p.bet?.stake_amount >= 10000
  ) || false;

  achievements.push({
    id: "maximum_roller",
    name: "Maximum Roller",
    description: "Place a bet with 10000+ points stake",
    icon: "💎",
    unlocked: hasMaxRollerBet,
  });

  // Social Butterfly Achievement (5+ friends)
  const { data: friends } = await supabase
    .from("friends")
    .select("id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  // Count unique friends (check both directions)
  const uniqueFriendIds = new Set<string>();
  friends?.forEach((friend) => {
    if (friend.user_id === userId) {
      uniqueFriendIds.add(friend.friend_id);
    } else {
      uniqueFriendIds.add(friend.user_id);
    }
  });

  const friendCount = uniqueFriendIds.size;

  achievements.push({
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Have 5 or more friends",
    icon: "🦋",
    unlocked: friendCount >= 5,
    progress: friendCount,
    maxProgress: 5,
  });

  return achievements;
}

