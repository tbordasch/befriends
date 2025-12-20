"use server";

import { getUserAchievements, Achievement } from "./achievements";
import { logActivity } from "./activities";
import { createClient } from "@/lib/supabase/server";

/**
 * Check for newly unlocked achievements and log activities
 * This should be called after events that could unlock achievements (bet won, friend added, etc.)
 */
export async function checkAndLogNewAchievements(userId: string) {
  const supabase = await createClient();

  // Get user's last viewed timestamp
  const { data: profile } = await supabase
    .from("profiles")
    .select("achievements_last_viewed_at")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const lastViewed = profile.achievements_last_viewed_at 
    ? new Date(profile.achievements_last_viewed_at)
    : null;

  // Get all achievements
  const achievements = await getUserAchievements(userId);

  // Find achievements that were unlocked after last view
  const newAchievements = achievements.filter((achievement) => {
    if (!achievement.unlocked || !achievement.unlockedAt) return false;
    
    const unlockedAt = new Date(achievement.unlockedAt);
    
    // If never viewed, only log if achievement was unlocked recently (last 24 hours)
    if (!lastViewed) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return unlockedAt > oneDayAgo;
    }
    
    return unlockedAt > lastViewed;
  });

  // Log activities for new achievements
  for (const achievement of newAchievements) {
    await logActivity(
      userId,
      "achievement_unlocked",
      `🏆 Achievement unlocked: ${achievement.name} - ${achievement.description}`,
      undefined,
      undefined,
      {
        achievement_id: achievement.id,
        achievement_name: achievement.name,
        achievement_icon: achievement.icon,
      }
    );
  }
}


