"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Get pending bet invitations for a user
 */
export async function getPendingInvitations(userId: string) {
  const supabase = await createClient();

  // First get the participant records
  const { data: participants, error: participantsError } = await supabase
    .from("bet_participants")
    .select("id, bet_id, status, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (participantsError || !participants) {
    return { success: false, error: participantsError?.message || "Failed to load invitations", invitations: [] };
  }

  if (participants.length === 0) {
    return { success: true, invitations: [] };
  }

  // Then get the bets for these participants
  // Use service role or bypass RLS by fetching bets directly
  const betIds = participants.map((p) => p.bet_id);
  
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select(
      `
      id,
      title,
      description,
      stake_amount,
      deadline,
      status,
      creator_id,
      creator:profiles!bets_creator_id_fkey(
        id,
        name,
        username
      )
    `
    )
    .in("id", betIds);

  if (betsError) {
    return { success: false, error: betsError.message, invitations: [] };
  }

  // Combine participants with their bets
  const invitations = participants
    .map((participant) => {
      const bet = bets?.find((b) => b.id === participant.bet_id);
      if (!bet) return null;
      return {
        ...participant,
        bet,
      };
    })
    .filter(Boolean);

  return { success: true, invitations };
}

/**
 * Get the latest pending invitation
 */
export async function getLatestPendingInvitation(userId: string) {
  const supabase = await createClient();

  // First get the latest participant record
  const { data: participant, error: participantError } = await supabase
    .from("bet_participants")
    .select("id, bet_id, status, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (participantError || !participant) {
    return { success: false, invitation: null };
  }

  // Then get the bet
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select(
      `
      id,
      title,
      description,
      stake_amount,
      deadline,
      status,
      creator_id,
      creator:profiles!bets_creator_id_fkey(
        id,
        name,
        username
      )
    `
    )
    .eq("id", participant.bet_id)
    .single();

  if (betError || !bet) {
    return { success: false, invitation: null };
  }

  return {
    success: true,
    invitation: {
      ...participant,
      bet,
    },
  };
}

/**
 * Accept a bet invitation
 */
export async function acceptInvitation(
  userId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get invitation details
  const { data: invitation, error: inviteError } = await supabase
    .from("bet_participants")
    .select(
      `
      id,
      bet_id,
      user_id,
      bet:bets!inner(
        id,
        stake_amount,
        status
      )
    `
    )
    .eq("id", invitationId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .single();

  if (inviteError || !invitation) {
    return { success: false, error: "Invitation not found" };
  }

  const stakeAmount = (invitation.bet as any).stake_amount;

  // Check if user has enough points
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_points")
    .eq("id", userId)
    .single();

  if (!profile || (profile.current_points || 0) < stakeAmount) {
    return { success: false, error: "Not enough points to accept this invitation" };
  }

  // Deduct points
  const { error: pointsError } = await supabase
    .from("profiles")
    .update({ current_points: (profile.current_points || 0) - stakeAmount })
    .eq("id", userId);

  if (pointsError) {
    return { success: false, error: "Failed to deduct points" };
  }

  // Update invitation status to accepted
  const { error: updateError } = await supabase
    .from("bet_participants")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  if (updateError) {
    // Refund points if update fails
    await supabase
      .from("profiles")
      .update({ current_points: (profile.current_points || 0) + stakeAmount })
      .eq("id", userId);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Decline a bet invitation
 */
export async function declineInvitation(
  userId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update invitation status to declined
  const { error } = await supabase
    .from("bet_participants")
    .update({ status: "declined" })
    .eq("id", invitationId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

