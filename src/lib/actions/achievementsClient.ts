"use client";

/**
 * Get count of new achievements for navigation badge
 * Note: This needs to be a server action or API route since we can't call server actions from client components easily
 * For now, we'll use a simpler client-side approach
 */
export async function getNewAchievementsCountForNav(userId: string): Promise<number> {
  // This is a placeholder - we'll implement proper server-side counting
  // For now, return 0 - the server-side function getNewAchievementsCount handles this
  return 0;
}
