"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Calculate locked points (client-side version)
 */
export async function getLockedPointsClient(userId: string): Promise<number> {
  const supabase = createClient();

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
 * Calculate potential win (client-side version)
 */
export async function getPotentialWinClient(userId: string): Promise<number> {
  const supabase = createClient();

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

