"use server";

import { createClient } from "@/lib/supabase/server";

export interface BettingStats {
  totalBets: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number; // percentage
  totalPointsWon: number;
  totalPointsLost: number;
  biggestWin: number;
  averageBetSize: number;
}

/**
 * Get comprehensive betting statistics for a user
 */
export async function getUserBettingStats(userId: string): Promise<BettingStats> {
  const supabase = await createClient();

  // Get all completed bets where user is a participant
  const { data: participants } = await supabase
    .from("bet_participants")
    .select(
      `
      bet_id,
      bet:bets!inner(
        id,
        stake_amount,
        status,
        created_at
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "accepted");

  if (!participants) {
    return {
      totalBets: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      totalPointsWon: 0,
      totalPointsLost: 0,
      biggestWin: 0,
      averageBetSize: 0,
    };
  }

  // Filter only completed bets and add type assertion for bet
  const completedBets = participants
    .map((p: any) => ({
      ...p,
      bet: (p.bet as any) as { id: string; stake_amount: number; status: string; created_at: string } | null
    }))
    .filter((p: any) => p.bet?.status === "completed");

  if (completedBets.length === 0) {
    // Calculate average bet size from all bets (not just completed)
    const allBetSizes = participants.map((p: any) => {
      const bet = (p.bet as any) as { stake_amount: number } | null;
      return bet?.stake_amount || 0;
    });
    const avgBetSize = allBetSizes.length > 0
      ? allBetSizes.reduce((sum, size) => sum + size, 0) / allBetSizes.length
      : 0;

    return {
      totalBets: participants.length,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      totalPointsWon: 0,
      totalPointsLost: 0,
      biggestWin: 0,
      averageBetSize: avgBetSize,
    };
  }

  let wins = 0;
  let losses = 0;
  let ties = 0;
  let totalPointsWon = 0;
  let totalPointsLost = 0;
  let biggestWin = 0;

  // For each completed bet, determine if user won
  for (const participant of completedBets) {
    const betId = participant.bet_id;
    const stakeAmount = participant.bet?.stake_amount || 0;

    // Get all votes for this bet
    const { data: votes } = await supabase
      .from("votes")
      .select("voted_for_user_id, voter_id")
      .eq("bet_id", betId);

    if (!votes || votes.length === 0) {
      // No votes = tie (points refunded)
      ties++;
      continue;
    }

    // Count votes for each user
    const voteCounts: Record<string, number> = {};
    votes.forEach((vote) => {
      voteCounts[vote.voted_for_user_id] = (voteCounts[vote.voted_for_user_id] || 0) + 1;
    });

    // Get total participants count
    const { data: betParticipants } = await supabase
      .from("bet_participants")
      .select("user_id")
      .eq("bet_id", betId)
      .eq("status", "accepted");

    const totalParticipants = betParticipants?.length || 0;

    if (totalParticipants === 0) continue;

    // Check if user won (has 100% of votes)
    const userVotes = voteCounts[userId] || 0;
    const isWinner = userVotes === totalParticipants && userVotes > 0;

    if (isWinner) {
      // User won - calculate pot size (stake_amount * total participants)
      const potSize = stakeAmount * totalParticipants;
      totalPointsWon += potSize;
      biggestWin = Math.max(biggestWin, potSize);
      wins++;
    } else {
      // Check if it's a tie (no one has 100% votes)
      const maxVotes = Math.max(...Object.values(voteCounts));
      if (maxVotes < totalParticipants) {
        // Tie - points refunded (so technically no loss)
        ties++;
      } else {
        // User lost (someone else won)
        totalPointsLost += stakeAmount;
        losses++;
      }
    }
  }

  // Calculate average bet size from all bets
  const allBetSizes = participants.map((p: any) => {
    const bet = (p.bet as any) as { stake_amount: number } | null;
    return bet?.stake_amount || 0;
  });
  const averageBetSize = allBetSizes.length > 0
    ? allBetSizes.reduce((sum, size) => sum + size, 0) / allBetSizes.length
    : 0;

  // Calculate win rate
  const totalCompleted = wins + losses + ties;
  const winRate = totalCompleted > 0 ? (wins / totalCompleted) * 100 : 0;

  return {
    totalBets: participants.length,
    wins,
    losses,
    ties,
    winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
    totalPointsWon,
    totalPointsLost,
    biggestWin,
    averageBetSize: Math.round(averageBetSize),
  };
}

