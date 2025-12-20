"use server";

import { createClient } from "@/lib/supabase/server";

export type ActivityType =
  | "bet_created"
  | "bet_invited"
  | "bet_invitation_accepted"
  | "bet_invitation_declined"
  | "join_request_sent"
  | "join_request_accepted"
  | "join_request_declined"
  | "bet_won"
  | "bet_tied"
  | "friend_request_sent"
  | "friend_request_accepted"
  | "friend_request_declined"
  | "friend_removed"
  | "friend_added"
  | "bet_joined"
  | "achievement_unlocked"
  | "bet_deleted";

export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  related_bet_id: string | null;
  related_user_id: string | null;
  message: string;
  metadata: any;
  created_at: string;
  bet?: {
    id: string;
    title: string;
  };
  related_user?: {
    id: string;
    name: string | null;
    username: string | null;
  };
}

/**
 * Log an activity
 */
export async function logActivity(
  userId: string,
  activityType: ActivityType,
  message: string,
  relatedBetId?: string,
  relatedUserId?: string,
  metadata?: any
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("log_activity", {
    p_user_id: userId,
    p_activity_type: activityType,
    p_message: message,
    p_related_bet_id: relatedBetId || null,
    p_related_user_id: relatedUserId || null,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error("[logActivity] Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get activities for a user
 */
export async function getUserActivities(userId: string, limit: number = 50) {
  const supabase = await createClient();

  const { data: activities, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      bet:bets(
        id,
        title
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message, activities: [] };
  }

  // Manually fetch related user profiles if needed
  // related_user_id references auth.users(id), but we need profiles
  const relatedUserIds = [...new Set((activities || [])
    .filter(a => a.related_user_id)
    .map(a => a.related_user_id as string))];

  let relatedUsersMap: Record<string, any> = {};
  if (relatedUserIds.length > 0) {
    const { data: users } = await supabase
      .from("profiles")
      .select("id, name, username")
      .in("id", relatedUserIds);
    
    if (users) {
      relatedUsersMap = users.reduce((acc: Record<string, any>, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
    }
  }

  // Add related_user to activities
  const activitiesWithUsers = (activities || []).map((activity: any) => ({
    ...activity,
    related_user: activity.related_user_id ? relatedUsersMap[activity.related_user_id] : null,
  }));

  return { success: true, activities: activitiesWithUsers || [] };
}

/**
 * Get count of unread activities (activities created after last view)
 * We'll use created_at > achievements_last_viewed_at as a proxy
 */
export async function getUnreadActivityCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get user's last viewed timestamp
  const { data: profile } = await supabase
    .from("profiles")
    .select("achievements_last_viewed_at")
    .eq("id", userId)
    .single();

  if (!profile?.achievements_last_viewed_at) {
    // If never viewed, return count of recent activities (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString());

    return count || 0;
  }

  const { count } = await supabase
    .from("activities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("created_at", profile.achievements_last_viewed_at);

  return count || 0;
}

/**
 * Mark activities as viewed (update achievements_last_viewed_at)
 */
export async function markActivitiesAsViewed(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ achievements_last_viewed_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

