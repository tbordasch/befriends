import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Coins } from "lucide-react";
import { CopyInviteLinkButton } from "@/components/bet/CopyInviteLinkButton";
import { JoinBetButton } from "@/components/bet/JoinBetButton";
import { InviteFriendsButton } from "@/components/bet/InviteFriendsButton";
import { DeleteBetButton } from "@/components/bet/DeleteBetButton";
import { ProofUpload } from "@/components/bet/ProofUpload";
import { ProofsDisplay } from "@/components/bet/ProofsDisplay";
import { VotingSection } from "@/components/bet/VotingSection";
import { getProofs } from "@/lib/actions/proofs";
import Link from "next/link";

async function getBet(betId: string, userId: string, inviteCode?: string) {
  const supabase = await createClient();

  const { data: bet, error } = await supabase
    .from("bets")
    .select(
      `
      *,
      creator:profiles!bets_creator_id_fkey(id, name, email),
      participants:bet_participants(
        id,
        user_id,
        status,
        user:profiles!bet_participants_user_id_fkey(id, name, email)
      )
    `
    )
    .eq("id", betId)
    .single();

  if (error || !bet) {
    return null;
  }

  // Check if user can view this bet
  const isCreator = bet.creator_id === userId;
  const isParticipant = bet.participants?.some(
    (p: any) => p.user_id === userId
  );
  const isPublic = !bet.is_private;
  const hasValidInviteCode = inviteCode && (bet as any).invite_code === inviteCode;

  // Allow access if:
  // - Public bet
  // - User is creator
  // - User is participant
  // - User has valid invite code
  if (!isPublic && !isCreator && !isParticipant && !hasValidInviteCode) {
    return null; // User doesn't have access
  }

  return bet;
}

export default async function BetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { id } = await params;
  const { invite } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bet = await getBet(id, user.id, invite);

  if (!bet) {
    notFound();
  }

  const isCreator = bet.creator_id === user.id;
  const currentParticipant = bet.participants?.find(
    (p: any) => p.user_id === user.id
  );
  const isParticipant = !!currentParticipant;
  const acceptedParticipants = bet.participants?.filter(
    (p: any) => p.status === "accepted"
  ) || [];
  // Pot size = stake_amount * number of accepted participants
  // Creator is automatically added as participant when bet is created, so count all accepted participants
  const potSize = bet.stake_amount * acceptedParticipants.length;

  const inviteLink = (bet as any).invite_code
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bets/${bet.id}?invite=${(bet as any).invite_code}`
    : null;

  // Get proofs for this bet
  const proofsResult = await getProofs(bet.id);
  const proofs = proofsResult.success ? proofsResult.proofs : [];

  // Get current user's proof if exists
  const currentUserProof = proofs.find((p: any) => p.user_id === user.id);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{bet.title}</CardTitle>
              <CardDescription className="text-base">
                Created by {bet.creator?.name || "Unknown"} •{" "}
                {new Date(bet.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {bet.status === "open" && isCreator && (
                <EditBetButton betId={bet.id} />
              )}
              {isCreator && inviteLink && (
                <CopyInviteLinkButton inviteLink={inviteLink} />
              )}
              {isCreator && bet.status !== "completed" && (
                <DeleteBetButton betId={bet.id} userId={user.id} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {bet.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {bet.description}
              </p>
            </div>
          )}

          {/* Bet Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Coins className="h-4 w-4" />
                <span>Stake</span>
              </div>
              <p className="text-xl font-bold">{bet.stake_amount} pts</p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Coins className="h-4 w-4" />
                <span>Pot Size</span>
              </div>
              <p className="text-xl font-bold">{potSize} pts</p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span>Participants</span>
              </div>
              <p className="text-xl font-bold">{acceptedParticipants.length}</p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Deadline</span>
              </div>
              <p className="text-sm font-semibold">
                {new Date(bet.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                bet.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : bet.status === "voting"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                  : bet.status === "completed"
                  ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
            >
              {bet.status}
            </span>
            {bet.is_private && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Private
              </span>
            )}
          </div>

          {/* Participants Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Participants ({acceptedParticipants.length})
            </h3>
            <div className="space-y-2">
              {/* Show creator first if they exist as participant */}
              {acceptedParticipants
                .filter((p: any) => p.user_id === bet.creator_id)
                .map((participant: any) => {
                  const isCurrentUser = participant.user_id === user.id;
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {participant.user?.name || bet.creator?.name || "Unknown"}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          (Creator)
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isCurrentUser && "(You)"}
                      </span>
                    </div>
                  );
                })}
              {/* Show other participants (excluding creator if already shown) */}
              {acceptedParticipants
                .filter((p: any) => p.user_id !== bet.creator_id)
                .map((participant: any) => {
                  const isCurrentUser = participant.user_id === user.id;
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {participant.user?.name || "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isCurrentUser && "(You)"}
                      </span>
                    </div>
                  );
                })}
              {acceptedParticipants.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No participants yet
                </p>
              )}
            </div>
          </div>

          {/* Proof Upload - Only for participants */}
          {isParticipant && bet.status !== "completed" && (
            <div className="pt-4 border-t">
              <ProofUpload
                betId={bet.id}
                userId={user.id}
                currentProofUrl={currentUserProof?.image_url}
              />
            </div>
          )}

          {/* Proofs Display */}
          {proofs.length > 0 && (
            <div className="pt-4 border-t">
              <ProofsDisplay proofs={proofs} />
            </div>
          )}

          {/* Voting Section - Only for participants */}
          {isParticipant && acceptedParticipants.length > 1 && (
            <div className="pt-4 border-t">
              <VotingSection
                betId={bet.id}
                userId={user.id}
                betStatus={bet.status}
                deadline={bet.deadline}
                participants={acceptedParticipants.map((p: any) => ({
                  id: p.id,
                  user_id: p.user_id,
                  user: p.user,
                }))}
              />
            </div>
          )}

          {/* Actions */}
          {isCreator && bet.status === "open" && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-3">Invite Friends</h3>
              <InviteFriendsButton betId={bet.id} userId={user.id} />
            </div>
          )}

          {!isParticipant && !isCreator && bet.status === "open" && (
            <div className="pt-4 border-t">
              <JoinBetButton betId={bet.id} userId={user.id} inviteCode={invite || undefined} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Bet Button Component
function EditBetButton({ betId }: { betId: string }) {
  return (
    <Button
      asChild
      variant="outline"
      className="min-h-[44px]"
    >
      <Link href={`/bets/${betId}/edit`}>Edit Bet</Link>
    </Button>
  );
}


