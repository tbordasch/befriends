import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Mail } from "lucide-react";
import { PointsDisplay } from "@/components/points/PointsDisplay";
import { getLockedPoints, getPotentialWin } from "@/lib/actions/points";

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
  const userEmail = profile.email || user.email || "No email";
  const availablePoints = profile.current_points || 0;
  const lockedPoints = await getLockedPoints(user.id);
  const potentialWin = await getPotentialWin(user.id);

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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

      {/* Betting Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bets Created</CardTitle>
            <CardDescription>Bets you've created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bets.created.length}</p>
            {bets.created.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Total stake:{" "}
                {bets.created
                  .reduce((sum, bet) => sum + (bet.stake_amount || 0), 0)
                  .toLocaleString()}{" "}
                points
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
            {bets.participated.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Active participation in {bets.participated.length} bet
                {bets.participated.length !== 1 ? "s" : ""}
              </p>
            )}
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

