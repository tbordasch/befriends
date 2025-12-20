"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activities";

/**
 * Cast or update a vote for a bet
 */
export async function castVote(
  betId: string,
  voterId: string,
  votedForUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify voter is a participant
  const { data: voterParticipant } = await supabase
    .from("bet_participants")
    .select("id")
    .eq("bet_id", betId)
    .eq("user_id", voterId)
    .eq("status", "accepted")
    .single();

  if (!voterParticipant) {
    return { success: false, error: "You are not a participant in this bet" };
  }

  // Verify voted_for_user is also a participant
  const { data: votedForParticipant } = await supabase
    .from("bet_participants")
    .select("id")
    .eq("bet_id", betId)
    .eq("user_id", votedForUserId)
    .eq("status", "accepted")
    .single();

  if (!votedForParticipant) {
    return { success: false, error: "The user you're voting for is not a participant" };
  }

  // Allow voting for yourself (user might think they won)

  // First, try to delete any existing vote (ignore errors - vote might not exist)
  const { error: deleteError } = await supabase
    .from("votes")
    .delete()
    .eq("bet_id", betId)
    .eq("voter_id", voterId);

  // If delete fails with RLS error, the vote might not exist or user might not have permission
  // We'll continue anyway and try to insert

  // Insert new vote (this will fail if unique constraint is violated)
  const { error } = await supabase
    .from("votes")
    .insert({
      bet_id: betId,
      voter_id: voterId,
      voted_for_user_id: votedForUserId,
    });

  if (error) {
    // If insert fails due to unique constraint, try update instead
    if (error.code === '23505' || error.message.includes('unique')) {
      const { error: updateError } = await supabase
        .from("votes")
        .update({ voted_for_user_id: votedForUserId })
        .eq("bet_id", betId)
        .eq("voter_id", voterId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      return { success: false, error: error.message };
    }
  }

  // DON'T check bet status here - it's too slow and called on every vote
  // We'll check it only when votes are confirmed (in confirmVote)
  // This makes voting much faster and more responsive

  return { success: true };
}

/**
 * Toggle vote (cast or revoke)
 */
export async function toggleVote(
  betId: string,
  voterId: string,
  votedForUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if user already voted for this person
  const { data: existingVote } = await supabase
    .from("votes")
    .select("voted_for_user_id")
    .eq("bet_id", betId)
    .eq("voter_id", voterId)
    .maybeSingle();

  // If already voted for this user, revoke vote
  if (existingVote && existingVote.voted_for_user_id === votedForUserId) {
    return revokeVote(betId, voterId);
  }

  // Otherwise, cast vote
  return castVote(betId, voterId, votedForUserId);
}

/**
 * Remove a vote (revoke)
 */
export async function revokeVote(
  betId: string,
  voterId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First verify that a vote exists
  const { data: existingVote, error: checkError } = await supabase
    .from("votes")
    .select("id")
    .eq("bet_id", betId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: `Failed to check vote: ${checkError.message}` };
  }

  if (!existingVote) {
    // Vote doesn't exist - that's okay, we can consider it already revoked
    return { success: true };
  }

  // Delete the vote
  const { error, count } = await supabase
    .from("votes")
    .delete()
    .eq("bet_id", betId)
    .eq("voter_id", voterId)
    .select();

  if (error) {
    return { success: false, error: `Failed to delete vote: ${error.message}` };
  }

  // Check if bet status needs to be updated (maybe all votes were cast and now one is revoked)
  await checkAndUpdateBetStatus(betId);

  return { success: true };
}

/**
 * Confirm a vote (finalize it - cannot be changed after confirmation)
 */
export async function confirmVote(
  betId: string,
  voterId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify vote exists
  const { data: vote, error: checkError } = await supabase
    .from("votes")
    .select("id, confirmed_at")
    .eq("bet_id", betId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: `Failed to check vote: ${checkError.message}` };
  }

  if (!vote) {
    return { success: false, error: "You must vote before confirming" };
  }

  if (vote.confirmed_at) {
    return { success: false, error: "Vote already confirmed" };
  }

  // Confirm the vote
  console.log(`[confirmVote] Confirming vote for bet ${betId}, voter ${voterId}`);
  const { error: updateError } = await supabase
    .from("votes")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("bet_id", betId)
    .eq("voter_id", voterId);

  if (updateError) {
    console.error(`[confirmVote] Error updating vote: ${updateError.message}`);
    return { success: false, error: `Failed to confirm vote: ${updateError.message}` };
  }

  console.log(`[confirmVote] Vote confirmed successfully, checking bet status...`);

  // Small delay to ensure the database update is fully committed
  // Reduced from 1000ms to 500ms for better responsiveness
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Now check if bet should be completed (will retry internally if not all confirmed yet)
  console.log(`[confirmVote] Now calling checkAndUpdateBetStatus for bet ${betId}`);
  await checkAndUpdateBetStatus(betId);
  console.log(`[confirmVote] checkAndUpdateBetStatus completed for bet ${betId}`);

  return { success: true };
}

/**
 * Get votes for a bet
 */
export async function getVotes(betId: string) {
  const supabase = await createClient();

  const { data: votes, error } = await supabase
    .from("votes")
    .select(
      `
      *,
      voter:profiles!votes_voter_id_fkey(
        id,
        name,
        username
      ),
      voted_for:profiles!votes_voted_for_user_id_fkey(
        id,
        name,
        username
      )
    `
    )
    .eq("bet_id", betId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message, votes: [] };
  }

  return { success: true, votes: votes || [] };
}

/**
 * Distribute points to winner
 */
async function distributePointsToWinner(
  betId: string,
  winnerUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get bet details
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("stake_amount")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { success: false, error: "Bet not found" };
  }

  // Get all accepted participants
  const { data: participants, error: participantsError } = await supabase
    .from("bet_participants")
    .select("user_id")
    .eq("bet_id", betId)
    .eq("status", "accepted");

  if (participantsError) {
    return { success: false, error: "Failed to get participants" };
  }

  if (!participants || participants.length === 0) {
    return { success: false, error: "No participants found" };
  }

  // Calculate total pot (stake_amount * number of participants)
  const totalPot = bet.stake_amount * participants.length;

  // Award points to winner using atomic function
  const { data: addResult, error: addError } = await supabase.rpc(
    "atomic_add_points",
    {
      p_user_id: winnerUserId,
      p_amount: totalPot,
    }
  );

  if (addError) {
    return { success: false, error: `Failed to award points: ${addError.message}` };
  }

  if (!addResult || addResult.length === 0 || !addResult[0].success) {
    return { success: false, error: "Failed to award points to winner" };
  }

  return { success: true };
}

/**
 * Refund points to all participants (for ties/draws)
 */
async function refundPointsToAllParticipants(
  betId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get bet details
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("stake_amount")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { success: false, error: "Bet not found" };
  }

  // Get all accepted participants
  const { data: participants, error: participantsError } = await supabase
    .from("bet_participants")
    .select("user_id")
    .eq("bet_id", betId)
    .eq("status", "accepted");

  if (participantsError) {
    return { success: false, error: "Failed to get participants" };
  }

  if (!participants || participants.length === 0) {
    return { success: false, error: "No participants found" };
  }

  // Refund points to all participants using atomic bulk refund function
  const userIds = participants.map((p) => p.user_id);
  
  const { data: refundResults, error: refundError } = await supabase.rpc(
    "atomic_refund_points_bulk",
    {
      p_user_ids: userIds,
      p_amount: bet.stake_amount,
    }
  );

  if (refundError) {
    return { success: false, error: `Failed to refund points: ${refundError.message}` };
  }

  if (refundResults) {
    const failedRefunds = refundResults.filter((r: any) => !r.success);
    if (failedRefunds.length > 0) {
      console.error("Some refunds failed:", failedRefunds);
      // Continue anyway - at least some refunds succeeded
    }
  }

  return { success: true };
}

/**
 * Check if all participants voted and update bet status / distribute points
 * Only completes the bet if ALL participants voted AND one person has 100% of votes
 */
async function checkAndUpdateBetStatus(betId: string) {
  const supabase = await createClient();

  // Get all accepted participants
  const { data: participants } = await supabase
    .from("bet_participants")
    .select("user_id")
    .eq("bet_id", betId)
    .eq("status", "accepted");

  if (!participants || participants.length === 0) {
    return;
  }

  const totalParticipants = participants.length;

  // Get bet details including deadline
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("status, deadline")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return;
  }

  // Don't update if bet is already completed
  if (bet.status === "completed") {
    return;
  }

  // Get all votes with confirmation status (reload to ensure we have latest data)
  // Small delay before fetching to ensure any recent updates are committed
  // Reduced from 600ms to 300ms for better performance
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Fetch votes multiple times if needed to ensure we have the latest data
  let votes;
  let votesError;
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    const result = await supabase
      .from("votes")
      .select("voted_for_user_id, confirmed_at, voter_id")
      .eq("bet_id", betId);
    
    votes = result.data;
    votesError = result.error;
    
    if (!votesError && votes) {
      break;
    }
    
    retries++;
    if (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  if (votesError) {
    console.error("[checkAndUpdateBetStatus] Error fetching votes:", votesError);
    return;
  }

  if (!votes || votes.length === 0) {
    console.log("[checkAndUpdateBetStatus] No votes found for bet");
    return;
  }
  
  console.log(`[checkAndUpdateBetStatus] Found ${votes.length} votes, checking confirmation status...`);
  votes.forEach((vote: any, index: number) => {
    console.log(`[checkAndUpdateBetStatus] Vote ${index + 1}: voter_id=${vote.voter_id}, confirmed_at=${vote.confirmed_at}`);
  });

  // Check if ALL participants have voted
  const allVoted = votes.length === totalParticipants;

  if (!allVoted) {
    return;
  }

  // Check if deadline has passed
  const deadline = new Date(bet.deadline);
  const now = new Date();
  const deadlinePassed = now >= deadline;

  // Check if ALL votes are confirmed (confirmed_at is not null and not undefined)
  let allConfirmed = votes.every((vote: any) => {
    return vote.confirmed_at !== null && vote.confirmed_at !== undefined;
  });
  
  const confirmedCount = votes.filter((vote: any) => vote.confirmed_at !== null && vote.confirmed_at !== undefined).length;
  console.log(`[checkAndUpdateBetStatus] Confirmed votes: ${confirmedCount}/${votes.length}, All confirmed: ${allConfirmed}, Deadline passed: ${deadlinePassed}`);

  // If not all confirmed yet and deadline hasn't passed, retry multiple times
  // This handles the case where another user just confirmed their vote in parallel
  if (!allConfirmed && !deadlinePassed) {
    console.log("[checkAndUpdateBetStatus] Not all votes confirmed yet. Retrying to check if other user just confirmed...");
    
    // Retry logic: Wait and check again if all votes are now confirmed
    // This handles race conditions where multiple users confirm at the same time
    // We keep retrying until all are confirmed or max retries reached
    const maxRetries = 12; // Reduced from 15, but still enough
    for (let retry = 0; retry < maxRetries; retry++) {
      await new Promise(resolve => setTimeout(resolve, 400)); // Reduced from 600ms
      
      // Reload votes to check if all are now confirmed
      const { data: retryVotes, error: retryError } = await supabase
        .from("votes")
        .select("voted_for_user_id, confirmed_at, voter_id")
        .eq("bet_id", betId);
      
      if (!retryError && retryVotes && retryVotes.length === totalParticipants) {
        allConfirmed = retryVotes.every((vote: any) => {
          return vote.confirmed_at !== null && vote.confirmed_at !== undefined;
        });
        
        const retryConfirmedCount = retryVotes.filter((vote: any) => vote.confirmed_at !== null && vote.confirmed_at !== undefined).length;
        console.log(`[checkAndUpdateBetStatus] Retry ${retry + 1}/${maxRetries}: Confirmed votes: ${retryConfirmedCount}/${retryVotes.length}, All confirmed: ${allConfirmed}`);
        
        if (allConfirmed) {
          console.log(`[checkAndUpdateBetStatus] All votes now confirmed on retry ${retry + 1}, proceeding with completion`);
          // Update votes variable to use the retry result
          votes = retryVotes;
          break; // Exit retry loop and proceed with completion
        }
      } else {
        console.log(`[checkAndUpdateBetStatus] Retry ${retry + 1}/${maxRetries}: Error or wrong vote count`, { retryError, retryVotesCount: retryVotes?.length, totalParticipants });
      }
    }
    
    // Final check after retries - if still not all confirmed, return early
    // But only if deadline hasn't passed (deadline handling comes after this)
    if (!allConfirmed && !deadlinePassed) {
      console.log("[checkAndUpdateBetStatus] Still not all votes confirmed after retries, returning early");
      return;
    }
  }

  // If deadline passed but not all confirmed, auto-confirm all unconfirmed votes
  if (deadlinePassed && !allConfirmed) {
    const unconfirmedVoteIds = votes.filter((vote: any) => !vote.confirmed_at).map((v: any) => v.voter_id);
    for (const voterId of unconfirmedVoteIds) {
      await supabase
        .from("votes")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("bet_id", betId)
        .eq("voter_id", voterId);
    }
    // After auto-confirming, reload votes to get updated confirmed_at values
    const { data: updatedVotes } = await supabase
      .from("votes")
      .select("voted_for_user_id, confirmed_at, voter_id")
      .eq("bet_id", betId);
    if (updatedVotes) {
      // Update votes array with confirmed votes
      votes.length = 0;
      votes.push(...updatedVotes);
    }
  }

  // Count votes per user (only confirmed votes count)
  const voteCounts: Record<string, number> = {};
  votes.forEach((vote) => {
    voteCounts[vote.voted_for_user_id] = (voteCounts[vote.voted_for_user_id] || 0) + 1;
  });

  // Find winner (user with most votes)
  let winnerUserId: string | null = null;
  let maxVotes = 0;

  Object.entries(voteCounts).forEach(([userId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      winnerUserId = userId;
    }
  });

  // Check if someone has 100% of votes (unanimous winner)
  const hasUnanimousWinner = winnerUserId && maxVotes === totalParticipants;

  // Double-check that bet is still not completed (race condition protection)
  const { data: recheckBet } = await supabase
    .from("bets")
    .select("status")
    .eq("id", betId)
    .single();
  
  if (recheckBet?.status === "completed") {
    console.log("[checkAndUpdateBetStatus] Bet was already completed by another process, skipping");
    return;
  }
  
  console.log(`[checkAndUpdateBetStatus] Setting bet ${betId} status to completed`);
  
  // Update bet status to completed FIRST
  const { error: updateError } = await supabase
    .from("bets")
    .update({ status: "completed" })
    .eq("id", betId)
    .eq("status", "open"); // Only update if still open (additional race condition protection)

  if (updateError) {
    console.error("[checkAndUpdateBetStatus] Failed to update bet status:", updateError);
    // Check if it was because status was already changed
    const { data: statusCheck } = await supabase
      .from("bets")
      .select("status")
      .eq("id", betId)
      .single();
    if (statusCheck?.status === "completed") {
      console.log("[checkAndUpdateBetStatus] Bet was completed by another process, that's okay");
      return;
    }
    return;
  }

  console.log(`[checkAndUpdateBetStatus] Bet status updated to completed successfully`);
  
  // Delay to ensure status update is committed to database
  await new Promise(resolve => setTimeout(resolve, 500));

  // Final check: Verify bet is actually completed (prevent duplicate activity logging)
  const { data: finalBetCheck } = await supabase
    .from("bets")
    .select("status")
    .eq("id", betId)
    .single();
  
  if (finalBetCheck?.status !== "completed") {
    console.log("[checkAndUpdateBetStatus] Bet status not completed in final check, skipping activity logging");
    return;
  }

  // Check if activities for this bet completion have already been logged
  // This prevents duplicate activity entries if the function runs multiple times
  const { data: existingActivities } = await supabase
    .from("activities")
    .select("id")
    .eq("related_bet_id", betId)
    .in("activity_type", ["bet_won", "bet_tied"])
    .limit(1);
  
  if (existingActivities && existingActivities.length > 0) {
    console.log("[checkAndUpdateBetStatus] Activities for bet completion already exist, skipping duplicate logging");
    return;
  }

  // Get bet title for activity messages
  const { data: betInfo } = await supabase
    .from("bets")
    .select("title, stake_amount")
    .eq("id", betId)
    .single();

  const betTitle = betInfo?.title || "a bet";

  // If we have a unanimous winner, distribute points to winner
  if (hasUnanimousWinner && winnerUserId) {
    // Distribute points to winner
    const distributeResult = await distributePointsToWinner(betId, winnerUserId);
    if (!distributeResult.success) {
      console.error("Failed to distribute points:", distributeResult.error);
    } else {
      // Log activity for winner
      await logActivity(
        winnerUserId,
        "bet_won",
        `You won "${betTitle}"`,
        betId,
        undefined,
        { stake_amount: betInfo?.stake_amount }
      );

      // Check for newly unlocked achievements (win could unlock achievements)
      const { checkAndLogNewAchievements } = await import("./achievementActivities");
      await checkAndLogNewAchievements(winnerUserId);

      // Log activity for all participants (losers)
      const loserIds = participants
        .map((p: any) => p.user_id)
        .filter((id: string) => id !== winnerUserId);
      
      for (const loserId of loserIds) {
        await logActivity(
          loserId,
          "bet_tied", // Use tied type for "you lost" (could be "bet_lost" but we use tied)
          `"${betTitle}" ended - you didn't win`,
          betId,
          winnerUserId
        );
      }
    }
  } else {
    // No unanimous winner = tie/draw - refund points to all participants
    const refundResult = await refundPointsToAllParticipants(betId);
    if (!refundResult.success) {
      console.error("Failed to refund points:", refundResult.error);
    } else {
      // Log activity for all participants (tie)
      for (const participant of participants) {
        await logActivity(
          participant.user_id,
          "bet_tied",
          `"${betTitle}" ended in a tie - points refunded`,
          betId
        );
      }
    }
  }
}

/**
 * Get current vote for a user in a bet
 */
export async function getUserVote(betId: string, userId: string) {
  const supabase = await createClient();

  const { data: vote, error } = await supabase
    .from("votes")
    .select("voted_for_user_id")
    .eq("bet_id", betId)
    .eq("voter_id", userId)
    .single();

  if (error || !vote) {
    return { success: true, votedForUserId: null };
  }

  return { success: true, votedForUserId: vote.voted_for_user_id };
}
