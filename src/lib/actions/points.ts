"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Calculate locked points (points currently in active bets)
 */
export async function getLockedPoints(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get all bets where user is a participant with accepted status
  const { data: participants } = await supabase
    .from("bet_participants")
    .select(
      `
      bet_id,
      status,
      bet:bets!inner(
        id,
        stake_amount,
        status
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "accepted");

  if (!participants) return 0;

  // Sum up stake amounts from active bets (open, active, voting) - exclude completed bets
  // Completed bets are excluded because points have been distributed to winner
  const lockedPoints = participants
    .filter((p: any) => ["open", "active", "voting"].includes(p.bet?.status))
    .reduce((sum: number, p: any) => {
      return sum + (p.bet?.stake_amount || 0);
    }, 0);

  return lockedPoints;
}

/**
 * Calculate potential win (sum of all pot sizes from bets user participates in)
 */
export async function getPotentialWin(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get all bets where user is a participant with accepted status
  const { data: participants } = await supabase
    .from("bet_participants")
    .select(
      `
      bet_id,
      status,
      bet:bets!inner(
        id,
        stake_amount,
        status
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "accepted");

  if (!participants) return 0;

  // Get all unique bet IDs for non-completed bets
  const betIds = [
    ...new Set(
      participants
        .filter((p: any) => ["open", "active", "voting"].includes(p.bet?.status))
        .map((p: any) => p.bet_id)
    ),
  ];

  if (betIds.length === 0) return 0;

  // Get participant counts for each bet
  const { data: betParticipants } = await supabase
    .from("bet_participants")
    .select("bet_id")
    .in("bet_id", betIds)
    .eq("status", "accepted");

  if (!betParticipants) return 0;

  // Count participants per bet
  const participantCounts: Record<string, number> = {};
  betParticipants.forEach((p) => {
    participantCounts[p.bet_id] = (participantCounts[p.bet_id] || 0) + 1;
  });

  // Get bets with stake amounts
  const { data: bets } = await supabase
    .from("bets")
    .select("id, stake_amount")
    .in("id", betIds)
    .in("status", ["open", "active", "voting"]);

  if (!bets) return 0;

  // Calculate potential win (sum of all pot sizes)
  const potentialWin = bets.reduce((sum: number, bet: any) => {
    const participantCount = participantCounts[bet.id] || 1;
    const potSize = bet.stake_amount * participantCount;
    return sum + potSize;
  }, 0);

  return potentialWin;
}

/**
 * Deduct points from user's account (atomic)
 */
export async function deductPoints(
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Use atomic function to prevent race conditions
  const { data, error } = await supabase.rpc("atomic_deduct_points", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "Failed to deduct points" };
  }

  const result = data[0];
  if (!result.success) {
    return { success: false, error: result.error_message || "Not enough points" };
  }

  return { success: true };
}

/**
 * Refund points to user's account (atomic)
 */
export async function refundPoints(
  userId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Use atomic function to prevent race conditions
  const { data, error } = await supabase.rpc("atomic_add_points", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "Failed to refund points" };
  }

  const result = data[0];
  if (!result.success) {
    return { success: false, error: result.error_message || "Failed to refund points" };
  }

  return { success: true };
}

/**
 * Get locked points for any user (for friend profiles - bypasses RLS)
 */
export async function getUserLockedPointsForFriend(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_locked_points", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error getting friend locked points:", error);
    return 0;
  }

  return data || 0;
}

/**
 * Get potential win for any user (for friend profiles - bypasses RLS)
 */
export async function getUserPotentialWinForFriend(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_potential_win", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error getting friend potential win:", error);
    return 0;
  }

  return data || 0;
}

