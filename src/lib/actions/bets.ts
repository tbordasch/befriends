"use server";

import { createClient } from "@/lib/supabase/server";
import { deductPoints, refundPoints } from "./points";
import { logActivity } from "./activities";

/**
 * Join a bet and deduct points
 * @param inviteCode - Optional invite code for private bets
 */
export async function joinBet(
  betId: string,
  userId: string,
  inviteCode?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get bet details to check stake amount and privacy
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("stake_amount, status, is_private, invite_code")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { success: false, error: "Bet not found" };
  }

  if (bet.status !== "open") {
    return { success: false, error: "Bet is not open" };
  }

  // If bet is private, require valid invite code
  if (bet.is_private && !inviteCode) {
    return { success: false, error: "This bet requires an invite code" };
  }

  if (bet.is_private && inviteCode && (bet as any).invite_code !== inviteCode) {
    return { success: false, error: "Invalid invite code" };
  }

  // Check if user is already a participant
  const { data: existing } = await supabase
    .from("bet_participants")
    .select("id")
    .eq("bet_id", betId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return { success: false, error: "You are already a participant" };
  }

  // Deduct points
  const deductResult = await deductPoints(userId, bet.stake_amount);
  if (!deductResult.success) {
    return deductResult;
  }

  // Add participant
  const { error: joinError } = await supabase
    .from("bet_participants")
    .insert({
      bet_id: betId,
      user_id: userId,
      status: "accepted",
    });

  if (joinError) {
    // Refund points if join fails
    await refundPoints(userId, bet.stake_amount);
    return { success: false, error: joinError.message };
  }

  return { success: true };
}

/**
 * Delete a bet (only creator can delete)
 */
export async function deleteBet(
  betId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user is the creator and bet is not completed
  // Get bet title before deletion for activity logging
  const { data: bet, error: fetchError } = await supabase
    .from("bets")
    .select("creator_id, stake_amount, status, title")
    .eq("id", betId)
    .single();

  if (fetchError || !bet) {
    return { success: false, error: "Bet not found" };
  }

  if (bet.creator_id !== userId) {
    return { success: false, error: "Only the creator can delete this bet" };
  }

  if (bet.status === "completed") {
    return { success: false, error: "Cannot delete a completed bet" };
  }

  const betTitle = bet.title || "a bet";

  // Get all accepted participants to refund their points
  const { data: participants, error: participantsError } = await supabase
    .from("bet_participants")
    .select("user_id")
    .eq("bet_id", betId)
    .eq("status", "accepted");

  if (participantsError) {
    return { success: false, error: `Failed to fetch participants: ${participantsError.message}` };
  }

  // Refund points to all participants (including creator) using atomic bulk function
  // All participants pay the same stake_amount, so refund that amount
  // IMPORTANT: Do this BEFORE deleting the bet to ensure points are refunded correctly
  if (participants && participants.length > 0) {
    const userIds = participants.map((p) => p.user_id);
    
    // Use atomic bulk refund function to prevent race conditions
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
        // Still continue with deletion, but log the error
      }
    }
  }

  // Log activity for bet deletion (BEFORE deletion so bet_id still exists)
  await logActivity(
    userId,
    "bet_deleted",
    `You deleted "${betTitle}"`,
    betId
  );

  // Delete the bet (cascade will delete participants, votes, proofs)
  // This happens AFTER points are refunded
  const { error: deleteError } = await supabase
    .from("bets")
    .delete()
    .eq("id", betId);

  if (deleteError) {
    return { success: false, error: `Failed to delete bet: ${deleteError.message}` };
  }

  return { success: true };
}
