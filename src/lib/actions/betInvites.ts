"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activities";

/**
 * Invite users to a bet (create pending participants)
 */
export async function inviteUsersToBet(
  betId: string,
  userIds: string[],
  creatorId: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = await createClient();

  // Verify creator
  const { data: bet, error: betError } = await supabase
    .from("bets")
    .select("id, creator_id, status")
    .eq("id", betId)
    .eq("creator_id", creatorId)
    .single();

  if (betError || !bet) {
    return { success: false, error: "Bet not found or you are not the creator" };
  }

  if (bet.status !== "open") {
    return { success: false, error: "Bet is not open" };
  }

  // Check which users are already participants
  const { data: existingParticipants } = await supabase
    .from("bet_participants")
    .select("user_id")
    .eq("bet_id", betId)
    .in("user_id", userIds);

  const existingUserIds = existingParticipants?.map((p) => p.user_id) || [];
  const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

  if (newUserIds.length === 0) {
    return { success: false, error: "All selected users are already participants" };
  }

  // Use the SECURITY DEFINER function to insert participant records
  // This bypasses RLS completely
  const { data: insertedParticipants, error: inviteError } = await supabase
    .rpc("insert_bet_participant_invites", {
      p_bet_id: betId,
      p_creator_id: creatorId,
      p_user_ids: newUserIds,
    });

  if (inviteError) {
    return { success: false, error: inviteError.message };
  }

  // Get bet title for activity messages
  const { data: betData } = await supabase
    .from("bets")
    .select("title")
    .eq("id", betId)
    .single();

  const betTitle = betData?.title || "a bet";

  // Get creator profile for activity messages
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("id", creatorId)
    .single();

  const creatorName = creatorProfile?.name || creatorProfile?.username || "Someone";

  // Log activities for invited users
  for (const userId of newUserIds) {
    // Get invited user profile for creator's activity message
    const { data: invitedUserProfile } = await supabase
      .from("profiles")
      .select("name, username")
      .eq("id", userId)
      .single();

    const invitedUserName = invitedUserProfile?.name || invitedUserProfile?.username || "Someone";

    // Log for invited user
    await logActivity(
      userId,
      "bet_invited",
      `${creatorName} invited you to "${betTitle}"`,
      betId,
      creatorId
    );

    // Log for creator
    await logActivity(
      creatorId,
      "bet_invited",
      `You invited ${invitedUserName} to "${betTitle}"`,
      betId,
      userId
    );
  }

  return { success: true, count: insertedParticipants?.length || 0 };
}

