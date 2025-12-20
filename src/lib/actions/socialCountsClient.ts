"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Get count of pending bet invitations (client-side)
 */
export async function getInvitationsCountClient(userId: string): Promise<number> {
  const supabase = createClient();

  const { data: participants, error } = await supabase
    .from("bet_participants")
    .select("bet_id, status")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error || !participants) {
    return 0;
  }

  if (participants.length === 0) {
    return 0;
  }

  // Get bets for these participants
  const betIds = participants.map((p) => p.bet_id);
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("id, creator_id, is_private")
    .in("id", betIds);

  if (betsError || !bets) {
    return 0;
  }

  // Count only private bets where user is NOT the creator (actual invitations)
  const invitationCount = bets.filter(
    (bet) => bet.creator_id !== userId && bet.is_private
  ).length;

  return invitationCount;
}

/**
 * Get count of pending friend requests received (client-side)
 */
export async function getFriendRequestsCountClient(userId: string): Promise<number> {
  const supabase = createClient();

  const { data: requests, error } = await supabase
    .from("friend_requests")
    .select("receiver_id, status")
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (error || !requests) {
    return 0;
  }

  return requests.length;
}

/**
 * Get count of pending join requests for bets created by user (client-side)
 * Join Requests are only for PUBLIC bets where someone requested to join
 * (not for private bets where the creator invited someone)
 */
export async function getJoinRequestsCountClient(creatorId: string): Promise<number> {
  const supabase = createClient();

  // Get only PUBLIC open bets created by user
  // Private bets = invitations, not join requests
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("status", "open")
    .eq("is_private", false); // Only public bets can have join requests

  if (betsError || !bets || bets.length === 0) {
    return 0;
  }

  const betIds = bets.map((b) => b.id);

  // Get pending participants for these PUBLIC bets only
  const { data: participants, error: participantsError } = await supabase
    .from("bet_participants")
    .select("id, status")
    .in("bet_id", betIds)
    .eq("status", "pending");

  if (participantsError || !participants) {
    return 0;
  }

  return participants.length;
}

/**
 * Get total social notification count (invitations + friend requests + join requests)
 */
export async function getTotalSocialCountClient(userId: string): Promise<number> {
  const [invitationsCount, friendRequestsCount, joinRequestsCount] = await Promise.all([
    getInvitationsCountClient(userId),
    getFriendRequestsCountClient(userId),
    getJoinRequestsCountClient(userId),
  ]);

  return invitationsCount + friendRequestsCount + joinRequestsCount;
}

