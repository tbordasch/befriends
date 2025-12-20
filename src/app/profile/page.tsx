import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Mail, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { PointsDisplay } from "@/components/points/PointsDisplay";
import { getLockedPoints, getPotentialWin } from "@/lib/actions/points";
import { getUserBettingStats } from "@/lib/actions/stats";
import { getUserAchievements } from "@/lib/actions/achievements";
import { AchievementBadge } from "@/components/profile/AchievementBadge";
import { markActivitiesAsViewed } from "@/lib/actions/activities";
import { checkAndLogNewAchievements } from "@/lib/actions/achievementActivities";

async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error,
    });
    return null;
  }

  return profile;
}

async function getUserBets(userId: string) {
  const supabase = await createClient();

  // Get bets created by user
  const { data: createdBets } = await supabase
    .from("bets")
    .select("id, title, status, stake_amount, created_at")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get bets where user is participant
  const { data: participantBets } = await supabase
    .from("bet_participants")
    .select("bet_id, bets(id, title, status, stake_amount, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    created: createdBets || [],
    participated: participantBets?.map((p: any) => p.bets).filter(Boolean) || [],
  };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);
  const bets = await getUserBets(user.id);

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userName = profile.name || "User";
  const username = profile.username || null;
  const userEmail = profile.email || user.email || "No email";
  const availablePoints = profile.current_points || 0;
  const lockedPoints = await getLockedPoints(user.id);
  const potentialWin = await getPotentialWin(user.id);
  const stats = await getUserBettingStats(user.id);
  const achievements = await getUserAchievements(user.id);
  
  // Check for newly unlocked achievements and log them
  await checkAndLogNewAchievements(user.id);
  
  // Mark achievements as viewed when user visits profile page
  await markActivitiesAsViewed(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your account information and betting statistics
        </p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{userName}</h3>
              {username && (
                <p className="text-sm font-medium text-primary">@{username}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span>{userEmail}</span>
              </div>
            </div>
          </div>

          <PointsDisplay
            available={availablePoints}
            locked={lockedPoints}
            potentialWin={potentialWin}
            variant="dashboard"
          />
        </CardContent>
      </Card>

      {/* Win/Loss Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Betting Statistics
          </CardTitle>
          <CardDescription>Your win/loss record and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                <p className="text-3xl font-bold">{stats.wins}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Wins</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                <TrendingDown className="h-5 w-5" />
                <p className="text-3xl font-bold">{stats.losses}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Losses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.ties}</p>
              <p className="text-sm text-muted-foreground mt-1">Ties</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.winRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Win Rate</p>
            </div>
          </div>
          
          {stats.totalBets > 0 && (
            <div className="grid gap-4 md:grid-cols-3 mt-6 pt-6 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Points Won</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalPointsWon.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points Lost</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {stats.totalPointsLost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biggest Win</p>
                <p className="text-xl font-bold">
                  {stats.biggestWin.toLocaleString()} pts
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Unlock badges by completing challenges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Betting Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bets Created</CardTitle>
            <CardDescription>Bets you've created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bets.created.length}</p>
            {stats.averageBetSize > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Avg. stake: {stats.averageBetSize.toLocaleString()} pts
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bets Participated</CardTitle>
            <CardDescription>Bets you've joined</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bets.participated.length}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Total bets: {stats.totalBets}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {(bets.created.length > 0 || bets.participated.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bets</CardTitle>
            <CardDescription>Your recent betting activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bets.created.slice(0, 5).map((bet: any) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{bet.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Created • {bet.stake_amount} pts
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {bet.status}
                  </span>
                </div>
              ))}
              {bets.created.length === 0 && bets.participated.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  No bets created yet, but you're participating in{" "}
                  {bets.participated.length} bet
                  {bets.participated.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {bets.created.length === 0 && bets.participated.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No betting activity yet. Create your first bet to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

