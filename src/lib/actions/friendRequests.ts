"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  requesterId: string,
  receiverId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (requesterId === receiverId) {
    return { success: false, error: "You cannot send a friend request to yourself" };
  }

  // Check if already friends (both directions)
  const { data: existingFriend1 } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", requesterId)
    .eq("friend_id", receiverId)
    .maybeSingle();

  const { data: existingFriend2 } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", receiverId)
    .eq("friend_id", requesterId)
    .maybeSingle();

  if (existingFriend1 || existingFriend2) {
    return { success: false, error: "You are already friends" };
  }

  // Check for existing requests in this direction
  const { data: existingRequestSameDirection } = await supabase
    .from("friend_requests")
    .select("id, status")
    .eq("requester_id", requesterId)
    .eq("receiver_id", receiverId)
    .maybeSingle();

  if (existingRequestSameDirection) {
    if (existingRequestSameDirection.status === "pending") {
      return { success: false, error: "You already sent a friend request to this user" };
    }
    // If status is "declined", delete the old request and allow a new one
    if (existingRequestSameDirection.status === "declined") {
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", existingRequestSameDirection.id);
      // Continue to create new request below
    } else if (existingRequestSameDirection.status === "accepted") {
      // If accepted, check if they're actually friends
      // If not, the request is in an invalid state, so delete it and allow a new one
      const { data: checkFriend } = await supabase
        .from("friends")
        .select("id")
        .or(`and(user_id.eq.${requesterId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${requesterId})`)
        .maybeSingle();
      
      if (!checkFriend) {
        // Request says accepted but no friendship exists - invalid state, clean it up
        await supabase
          .from("friend_requests")
          .delete()
          .eq("id", existingRequestSameDirection.id);
        // Continue to create new request below
      } else {
        // They are actually friends
        return { success: false, error: "You are already friends with this user" };
      }
    }
  }

  // Check for existing requests in the opposite direction
  const { data: existingRequestOppositeDirection } = await supabase
    .from("friend_requests")
    .select("id, status")
    .eq("requester_id", receiverId)
    .eq("receiver_id", requesterId)
    .maybeSingle();

  if (existingRequestOppositeDirection) {
    if (existingRequestOppositeDirection.status === "pending") {
      return { success: false, error: "This user already sent you a friend request. Check your friend requests!" };
    } else if (existingRequestOppositeDirection.status === "accepted") {
      // If accepted, check if they're actually friends
      // If not, the request is in an invalid state, so delete it and allow a new one
      const { data: checkFriend } = await supabase
        .from("friends")
        .select("id")
        .or(`and(user_id.eq.${requesterId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${requesterId})`)
        .maybeSingle();
      
      if (!checkFriend) {
        // Request says accepted but no friendship exists - invalid state, clean it up
        await supabase
          .from("friend_requests")
          .delete()
          .eq("id", existingRequestOppositeDirection.id);
        // Continue to create new request below
      } else {
        // They are actually friends
        return { success: false, error: "You are already friends with this user" };
      }
    } else if (existingRequestOppositeDirection.status === "declined") {
      // If declined in opposite direction (we received it and declined it),
      // we can delete it (with the new DELETE policy) and then send a new request
      await supabase
        .from("friend_requests")
        .delete()
        .eq("id", existingRequestOppositeDirection.id);
      // Continue to create new request below
    }
  }

  // Create friend request
  const { error } = await supabase
    .from("friend_requests")
    .insert({
      requester_id: requesterId,
      receiver_id: receiverId,
      status: "pending",
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get pending friend requests for a user (both sent and received)
 */
export async function getFriendRequests(userId: string) {
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("friend_requests")
    .select(
      `
      id,
      requester_id,
      receiver_id,
      status,
      created_at,
      requester:profiles!friend_requests_requester_id_fkey(
        id,
        name,
        username,
        email
      ),
      receiver:profiles!friend_requests_receiver_id_fkey(
        id,
        name,
        username,
        email
      )
    `
    )
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message, requests: [] };
  }

  return { success: true, requests: requests || [] };
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the request
  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("id, requester_id, receiver_id, status")
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .single();

  if (requestError || !request) {
    return { success: false, error: "Friend request not found" };
  }

  // Start transaction-like operations
  // Update request status to accepted
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Create friendship (one direction: receiver -> requester)
  // Note: Due to RLS, we can only create records with user_id = auth.uid()
  // getUserFriends() checks both directions, so both users will see each other
  const { error: friendError } = await supabase
    .from("friends")
    .insert({
      user_id: request.receiver_id, // The user who accepted (current user)
      friend_id: request.requester_id, // The user who sent the request
    });

  if (friendError) {
    // Rollback request status if friend creation fails
    await supabase
      .from("friend_requests")
      .update({ status: "pending" })
      .eq("id", requestId);
    return { success: false, error: friendError.message };
  }

  return { success: true };
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update request status to declined
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

