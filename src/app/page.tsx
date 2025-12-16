import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BetCard } from "@/components/bet/BetCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PointsDisplay } from "@/components/points/PointsDisplay";
import { getLockedPoints, getPotentialWin } from "@/lib/actions/points";
import { getLatestPendingInvitation } from "@/lib/actions/invitations";
import { InvitationCard } from "@/components/invitations/InvitationCard";
import type { Bet, BetParticipant, Profile } from "@/types/database";

async function getBets(userId: string) {
  const supabase = await createClient();

  // Get bets where user is a participant with ACCEPTED status only
  const { data: participantBets } = await supabase
    .from("bet_participants")
    .select("bet_id")
    .eq("user_id", userId)
    .eq("status", "accepted"); // Only show accepted participants, not pending invitations

  const participantBetIds =
    participantBets?.map((p) => p.bet_id) || [];

  // Get bets where user is creator
  const { data: createdBets } = await supabase
    .from("bets")
    .select(
      `
      *,
      participants:bet_participants(
        id,
        user_id,
        status
      )
    `
    )
    .eq("creator_id", userId);

  // Get bets where user is participant
  let participatedBets: any[] | null = null;
  if (participantBetIds.length > 0) {
    const { data } = await supabase
      .from("bets")
      .select(
        `
        *,
        participants:bet_participants(
          id,
          user_id,
          status
        )
      `
      )
      .in("id", participantBetIds);
    participatedBets = data;
  }

  // Combine and deduplicate bets
  const allBets = [
    ...(createdBets || []),
    ...(participatedBets || []),
  ];
  const uniqueBets = Array.from(
    new Map(allBets.map((bet) => [bet.id, bet])).values()
  );

  // Sort by created_at and limit
  return uniqueBets
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);
}

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

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);
  const bets = await getBets(user.id);

  // Transform bets to match BetCard props format
  const transformedBets = bets.map((bet: any) => {
    const participants = bet.participants || [];
    const acceptedParticipants = participants.filter(
      (p: any) => p.status === "accepted"
    );
    // Include the creator as a participant for pot calculation
    const totalParticipants = Math.max(acceptedParticipants.length, 1);
    const potSize = bet.stake_amount * totalParticipants;

    return {
      id: bet.id,
      title: bet.title,
      description: bet.description || "",
      stake: bet.stake_amount,
      participants: totalParticipants,
      potSize,
      status: bet.status,
      deadline: bet.deadline, // Pass raw deadline string to calculate days
    };
  });

  const userName = profile?.name || "Friend";
  const availablePoints = profile?.current_points || 0;
  const lockedPoints = await getLockedPoints(user.id);
  const potentialWin = await getPotentialWin(user.id);

  // Get latest pending invitation
  const latestInvitation = await getLatestPendingInvitation(user.id);

  return (
    <div className="space-y-6">
      {/* Latest Invitation Section */}
      {latestInvitation.success && latestInvitation.invitation && (
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            New Bet Invitation
          </h2>
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>{latestInvitation.invitation.bet?.title}</CardTitle>
              <CardDescription>
                Invited by{" "}
                {(latestInvitation.invitation.bet?.creator as any)?.name ||
                  (latestInvitation.invitation.bet?.creator as any)?.username ||
                  "Unknown"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationCard
                invitation={latestInvitation.invitation}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hello {userName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your bets.
          </p>
        </div>

        {/* Points Display - Visible on Mobile, hidden on Desktop (shown in Sidebar) */}
        <div className="md:hidden">
          <PointsDisplay
            available={availablePoints}
            locked={lockedPoints}
            potentialWin={potentialWin}
            variant="dashboard"
          />
        </div>
      </div>

      {/* Active Bets Section */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Your Active Bets
        </h2>
        {transformedBets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {transformedBets.map((bet) => (
              <BetCard key={bet.id} {...bet} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No bets yet. Create your first bet to get started!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
