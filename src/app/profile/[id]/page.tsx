import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, ArrowLeft } from "lucide-react";
import { getUserLockedPointsForFriend, getUserPotentialWinForFriend } from "@/lib/actions/points";
import { getUserAchievements } from "@/lib/actions/achievements";
import { AchievementBadge } from "@/components/profile/AchievementBadge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

async function getFriendProfile(userId: string, currentUserId: string) {
  const supabase = await createClient();

  // Get friend profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Verify they are friends (check both directions)
  const { data: friendship1 } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", currentUserId)
    .eq("friend_id", userId)
    .single();
  
  const { data: friendship2 } = await supabase
    .from("friends")
    .select("id")
    .eq("user_id", userId)
    .eq("friend_id", currentUserId)
    .single();

  const friendship = friendship1 || friendship2;

  if (!friendship) {
    // Not friends - don't show profile
    return null;
  }

  return profile;
}

export default async function FriendProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: friendId } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const friendProfile = await getFriendProfile(friendId, user.id);

  if (!friendProfile) {
    notFound();
  }

  const friendName = friendProfile.name || "Friend";
  const username = friendProfile.username;
  const avatarUrl = friendProfile.avatar_url;
  const lockedPoints = await getUserLockedPointsForFriend(friendId);
  const potentialWin = await getUserPotentialWinForFriend(friendId);
  const achievements = await getUserAchievements(friendId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/friends">
          <Button variant="ghost" size="sm" className="min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Friends
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{friendName}'s Profile</h1>
        <p className="text-muted-foreground mt-1">
          View your friend's profile and achievements
        </p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Friend's profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-primary/10">
                <Image
                  src={avatarUrl}
                  alt={friendName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{friendName}</h3>
              {username && (
                <p className="text-sm font-medium text-primary">@{username}</p>
              )}
            </div>
          </div>

          {/* Points in Bets and Potential Win */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Points in Bets</span>
                  <span className="text-lg font-bold">{lockedPoints.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Potential Win</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {potentialWin.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Badges unlocked by {friendName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

