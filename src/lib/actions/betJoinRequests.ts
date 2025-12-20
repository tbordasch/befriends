"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activities";

/**
 * Request to join a public bet (creates pending participant)
 */
export async function requestToJoinBet(
  betId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get bet details
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("stake_amount, status, is_private, creator_id")
    .eq("id", betId)
    .single();

  if (betError || !bet) {
    return { success: false, error: "Bet not found" };
  }

  if (bet.status !== "open") {
    return { success: false, error: "Bet is not open" };
  }

  // Only allow requests for public bets
  if (bet.is_private) {
    return { success: false, error: "This bet is private. Use an invite code to join." };
  }

  // Can't request to join your own bet
  if (bet.creator_id === userId) {
    return { success: false, error: "You cannot join your own bet" };
  }

  // Check if user already requested or is participant
  const { data: existing } = await supabase
    .from("bet_participants")
    .select("id, status")
    .eq("bet_id", betId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") {
      return { success: false, error: "You are already a participant in this bet" };
    }
    if (existing.status === "pending") {
      return { success: false, error: "You have already requested to join this bet" };
    }
  }

  // Create pending participant (creator needs to accept)
  const { error: insertError } = await supabase
    .from("bet_participants")
    .insert({
      bet_id: betId,
      user_id: userId,
      status: "pending",
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Get bet title and creator info for activity messages
  const { data: betData } = await supabase
    .from("bets")
    .select("title, creator_id")
    .eq("id", betId)
    .single();

  const betTitle = betData?.title || "a bet";
  const creatorId = betData?.creator_id;

  // Get requester profile info for activity messages
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("id", userId)
    .single();

  const requesterName = requesterProfile?.name || requesterProfile?.username || "Someone";

  // Log activity for requester
  await logActivity(
    userId,
    "join_request_sent",
    `You requested to join "${betTitle}"`,
    betId,
    creatorId || undefined
  );

  // Log activity for creator (someone wants to join)
  if (creatorId) {
    await logActivity(
      creatorId,
      "join_request_sent",
      `${requesterName} wants to join "${betTitle}"`,
      betId,
      userId
    );
  }

  return { success: true };
}

/**
 * Get join requests for bets created by user
 */
export async function getJoinRequestsForCreator(creatorId: string) {
  const supabase = await createClient();

  // Try to use SECURITY DEFINER function to bypass RLS
  const { data: requests, error: rpcError } = await supabase.rpc("get_join_requests_for_creator", {
    p_creator_id: creatorId,
  });

  // If function doesn't exist, return helpful error message
  // Note: Direct query won't work due to RLS - creator is not a participant, so they can't see bet_participants
  if (rpcError && (rpcError.message.includes("could not find the function") || rpcError.message.includes("schema cache"))) {
    return { 
      success: false, 
      error: "Please run the SQL script 'ADD_JOIN_REQUESTS_FUNCTION.sql' in Supabase SQL Editor to enable join request notifications.",
      requests: [] 
    };
  }

  if (rpcError) {
    return { success: false, error: rpcError.message, requests: [] };
  }

  // Format the results from RPC
  const joinRequests = (requests || []).map((r: any) => ({
    id: r.request_id,
    betId: r.bet_id,
    betTitle: r.bet_title,
    betStake: r.bet_stake,
    userId: r.user_id,
    userName: r.user_name,
    userUsername: r.user_username,
    requestedAt: r.requested_at,
  }));

  return { success: true, requests: joinRequests };
}

/**
 * Accept a join request (creator accepts user to join)
 */
export async function acceptJoinRequest(
  requestId: string,
  creatorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the participant record
  const { data: participant, error: fetchError } = await supabase
    .from("bet_participants")
    .select(
      `
      id,
      bet_id,
      user_id,
      status,
      bet:bets!inner(
        id,
        creator_id,
        stake_amount,
        status
      )
    `
    )
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (fetchError || !participant) {
    return { success: false, error: "Join request not found" };
  }

  // Type assertion: bet is a single object, not an array (due to !inner and .single())
  const bet = (participant as any).bet as { id: string; creator_id: string; stake_amount: number; status: string };

  // Verify creator owns this bet
  if (bet.creator_id !== creatorId) {
    return { success: false, error: "You are not the creator of this bet" };
  }

  if (bet.status !== "open") {
    return { success: false, error: "Bet is not open" };
  }

  // Deduct points from the user
  const { data: deductResult, error: deductError } = await supabase.rpc(
    "atomic_deduct_points",
    {
      p_user_id: participant.user_id,
      p_amount: bet.stake_amount,
    }
  );

  if (deductError) {
    return { success: false, error: `Failed to deduct points: ${deductError.message}` };
  }

  if (!deductResult || deductResult.length === 0 || !deductResult[0].success) {
    const errorMsg = deductResult?.[0]?.error_message || "User doesn't have enough points";
    return { success: false, error: errorMsg };
  }

  // Update participant status to accepted using SECURITY DEFINER function (bypasses RLS)
  const { data: updateResult, error: updateError } = await supabase.rpc(
    "update_bet_participant_status",
    {
      p_request_id: requestId,
      p_creator_id: creatorId,
      p_new_status: "accepted",
    }
  );

  if (updateError) {
    // Refund points if update fails
    await supabase.rpc("atomic_add_points", {
      p_user_id: participant.user_id,
      p_amount: bet.stake_amount,
    });
    return { success: false, error: updateError.message };
  }

  // Check if update was successful
  if (!updateResult || updateResult.length === 0 || !updateResult[0].success) {
    const errorMsg = updateResult?.[0]?.error_message || "Failed to update participant status";
    // Refund points if update failed
    await supabase.rpc("atomic_add_points", {
      p_user_id: participant.user_id,
      p_amount: bet.stake_amount,
    });
    return { success: false, error: errorMsg };
  }

  // Get bet title and user info for activity messages
  const { data: betData } = await supabase
    .from("bets")
    .select("title")
    .eq("id", bet.id)
    .single();

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("id", participant.user_id)
    .single();

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("id", creatorId)
    .single();

  const betTitle = betData?.title || "a bet";
  const requesterName = requesterProfile?.name || requesterProfile?.username || "Someone";
  const creatorName = creatorProfile?.name || creatorProfile?.username || "The creator";

  // Log activity for requester (their request was accepted)
  await logActivity(
    participant.user_id,
    "join_request_accepted",
    `Your join request for "${betTitle}" was accepted`,
    bet.id,
    creatorId
  );

  // Log activity for creator (they accepted the request)
  await logActivity(
    creatorId,
    "join_request_accepted",
    `You accepted ${requesterName}'s join request for "${betTitle}"`,
    bet.id,
    participant.user_id
  );

  return { success: true };
}

/**
 * Decline a join request
 */
export async function declineJoinRequest(
  requestId: string,
  creatorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the participant record to verify creator
  const { data: participant, error: fetchError } = await supabase
    .from("bet_participants")
    .select(
      `
      id,
      bet_id,
      status,
      bet:bets!inner(
        creator_id
      )
    `
    )
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (fetchError || !participant) {
    return { success: false, error: "Join request not found" };
  }

  // Type assertion: bet is a single object, not an array (due to !inner and .single())
  const bet = (participant as any).bet as { creator_id: string };

  // Verify creator owns this bet
  if (bet.creator_id !== creatorId) {
    return { success: false, error: "You are not the creator of this bet" };
  }

  // Update participant status to declined using SECURITY DEFINER function (bypasses RLS)
  const { data: updateResult, error: updateError } = await supabase.rpc(
    "update_bet_participant_status",
    {
      p_request_id: requestId,
      p_creator_id: creatorId,
      p_new_status: "declined",
    }
  );

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Check if update was successful
  if (!updateResult || updateResult.length === 0 || !updateResult[0].success) {
    const errorMsg = updateResult?.[0]?.error_message || "Failed to decline join request";
    return { success: false, error: errorMsg };
  }

  // Get bet and requester info for activity logging
  const { data: requestData } = await supabase
    .from("bet_participants")
    .select(
      `
      user_id,
      bet:bets!inner(
        id,
        title,
        creator_id
      )
    `
    )
    .eq("id", requestId)
    .single();

  if (requestData?.bet && requestData?.user_id) {
    const betTitle = (requestData.bet as any).title || "a bet";
    const requesterId = requestData.user_id;

    // Log for creator
    await logActivity(
      creatorId,
      "join_request_declined",
      `You declined a join request for "${betTitle}"`,
      (requestData.bet as any).id,
      requesterId
    );

    // Log for requester
    await logActivity(
      requesterId,
      "join_request_declined",
      `Your join request for "${betTitle}" was declined`,
      (requestData.bet as any).id,
      creatorId
    );
  }

  return { success: true };
}

