"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activities";

/**
 * Search for users by username
 */
export async function searchUsersByUsername(
  searchQuery: string,
  currentUserId: string
): Promise<{ success: boolean; users?: any[]; error?: string }> {
  const supabase = await createClient();

  if (!searchQuery || searchQuery.length < 2) {
    return { success: false, error: "Search query must be at least 2 characters" };
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, name, username, email")
    .ilike("username", `%${searchQuery}%`)
    .neq("id", currentUserId)
    .limit(10);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, users: users || [] };
}

/**
 * Get user's friends (checks both directions)
 */
export async function getUserFriends(
  userId: string
): Promise<{ success: boolean; friends?: any[]; error?: string }> {
  const supabase = await createClient();

  // Get friends where user is user_id
  const { data: friendsAsUser, error: error1 } = await supabase
    .from("friends")
    .select(
      `
      id,
      friend_id,
      created_at,
      friend:profiles!friends_friend_id_fkey(
        id,
        name,
        username,
        email,
        avatar_url
      )
    `
    )
    .eq("user_id", userId);

  // Get friends where user is friend_id (reverse direction)
  const { data: friendsAsFriend, error: error2 } = await supabase
    .from("friends")
    .select(
      `
      id,
      user_id,
      created_at,
      user:profiles!friends_user_id_fkey(
        id,
        name,
        username,
        email,
        avatar_url
      )
    `
    )
    .eq("friend_id", userId);

  if (error1 || error2) {
    return { success: false, error: error1?.message || error2?.message };
  }

  // Combine both directions
  const friends1 = friendsAsUser?.map((f: any) => f.friend) || [];
  const friends2 = friendsAsFriend?.map((f: any) => f.user) || [];
  
  // Deduplicate by id
  const friendsMap = new Map();
  [...friends1, ...friends2].forEach((friend) => {
    if (friend && !friendsMap.has(friend.id)) {
      friendsMap.set(friend.id, friend);
    }
  });

  const allFriends = Array.from(friendsMap.values());

  return {
    success: true,
    friends: allFriends,
  };
}

/**
 * Add a friend (now sends a friend request instead)
 * @deprecated Use sendFriendRequest instead
 */
export async function addFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  // Redirect to friend request system
  const { sendFriendRequest } = await import("./friendRequests");
  return sendFriendRequest(userId, friendId);
}

/**
 * Remove a friend (deletes friendship - works from both sides due to RLS policy)
 */
export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Delete the friendship entry
  // Since we only store one direction (user_id -> friend_id), we need to try both
  // The RLS policy allows deletion if user is either user_id or friend_id
  // So this will work regardless of which direction the friendship is stored
  
  // Try deleting where userId is user_id
  const { data: deleted1, error: error1 } = await supabase
    .from("friends")
    .delete()
    .eq("user_id", userId)
    .eq("friend_id", friendId)
    .select();

  // Check for error from first query
  if (error1) {
    return { success: false, error: error1.message };
  }

  // If nothing was deleted, try the reverse direction (where userId is friend_id)
  if (!deleted1 || deleted1.length === 0) {
    const { error: error2 } = await supabase
      .from("friends")
      .delete()
      .eq("user_id", friendId)
      .eq("friend_id", userId);

    if (error2) {
      return { success: false, error: error2.message };
    }
  }

  // Log activity for both users
  await logActivity(
    userId,
    "friend_removed",
    `You removed a friend`,
    undefined,
    friendId
  );

  await logActivity(
    friendId,
    "friend_removed",
    `You were removed as a friend`,
    undefined,
    userId
  );

  return { success: true };
}

