"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, Coins } from "lucide-react";
import { toggleVote, getVotes, confirmVote } from "@/lib/actions/votes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Component to poll bet status and reload when completed
function ProcessingResults({ betId, onComplete }: { betId: string; onComplete: () => void }) {
  useEffect(() => {
    const supabase = createClient();
    let pollCount = 0;
    const maxPolls = 20; // Max 20 polls (20 seconds)
    
    console.log("[ProcessingResults] Starting to poll bet status for betId:", betId);
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`[ProcessingResults] Poll ${pollCount}/${maxPolls} - Checking bet status...`);
      
      // Use a fresh query each time to avoid caching issues
      const { data: bet, error } = await supabase
        .from("bets")
        .select("status")
        .eq("id", betId)
        .single();
      
      if (error) {
        console.error("[ProcessingResults] Error fetching bet status:", error);
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          console.log("[ProcessingResults] Max polls reached with error, forcing reload");
          setTimeout(() => onComplete(), 1000);
        }
        return;
      }
      
      if (bet) {
        console.log(`[ProcessingResults] Bet status: ${bet.status}`);
        
        if (bet.status === "completed") {
          console.log("[ProcessingResults] Bet is completed! Reloading page...");
          clearInterval(pollInterval);
          // Wait a bit more to ensure all DB operations are complete (points distribution, etc.)
          setTimeout(() => {
            console.log("[ProcessingResults] Executing reload now");
            onComplete();
          }, 1500);
          return;
        }
      }
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        console.log("[ProcessingResults] Max polls reached, forcing reload");
        // Force reload after max polls even if status not changed
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }, 800); // Poll every 800ms (faster polling)
    
    return () => {
      console.log("[ProcessingResults] Cleaning up poll interval");
      clearInterval(pollInterval);
    };
  }, [betId, onComplete]);
  
  return null;
}

interface VotingSectionProps {
  betId: string;
  userId: string;
  betStatus: "open" | "active" | "voting" | "completed"; // Bet status to determine if voting is allowed
  deadline: string; // Deadline for the bet (ISO string)
  participants: Array<{
    id: string;
    user_id: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
    };
  }>;
}

export function VotingSection({
  betId,
  userId,
  betStatus,
  participants,
}: VotingSectionProps) {
  const [votes, setVotes] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [userVoteConfirmed, setUserVoteConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Show all participants (including self - user can vote for themselves if they think they won)
  const votableParticipants = participants;

  const loadVotes = async () => {
    setLoading(true);
    const votesResult = await getVotes(betId);
    if (votesResult.success) {
      setVotes(votesResult.votes || []);
      // Find current user's vote
      const myVote = votesResult.votes?.find(
        (v: any) => v.voter_id === userId
      );
      const isConfirmed = myVote?.confirmed_at !== null && myVote?.confirmed_at !== undefined;
      console.log("[VotingSection] loadVotes - myVote:", myVote, "isConfirmed:", isConfirmed);
      setUserVote(myVote?.voted_for_user_id || null);
      setUserVoteConfirmed(isConfirmed);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (betId && userId) {
      loadVotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betId, userId]);

  const handleToggleVote = async (votedForUserId: string) => {
    // Disable voting if bet is completed or if vote is already confirmed
    if (voting || betStatus === "completed" || userVoteConfirmed) return;

    setVoting(votedForUserId);
    setError("");

    // Optimistic UI update - update state immediately for instant feedback
    const previousVote = userVote;
    const newVote = userVote === votedForUserId ? null : votedForUserId;
    setUserVote(newVote);

    try {
      const result = await toggleVote(betId, userId, votedForUserId);
      if (!result.success) {
        // Revert optimistic update on error
        setUserVote(previousVote);
        setError(result.error || "Failed to toggle vote");
        setVoting(null);
        return;
      }

      // Reload votes in the background to sync with server (non-blocking)
      // Don't await - let it happen async while UI is already updated
      loadVotes().catch(err => console.error("Error reloading votes:", err));
    } catch (err: any) {
      // Revert optimistic update on error
      setUserVote(previousVote);
      console.error("Error in handleToggleVote:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setVoting(null);
    }
  };

  // Calculate vote counts
  const voteCounts: Record<string, number> = {};
  votes.forEach((vote) => {
    voteCounts[vote.voted_for_user_id] =
      (voteCounts[vote.voted_for_user_id] || 0) + 1;
  });

  const totalVotes = votes.length;
  const totalParticipants = participants.length;
  const allVoted = totalVotes === totalParticipants;
  const allConfirmed = votes.every((v: any) => v.confirmed_at !== null && v.confirmed_at !== undefined);
  const isCompleted = betStatus === "completed";

  // Note: Bet completion is now handled by the OK button click handler above
  // This useEffect was causing infinite reload loops, so it's been disabled

  // Find winner if bet is completed
  let winnerUserId: string | null = null;
  let maxVotes = 0;
  if (isCompleted && votes.length > 0) {
    Object.entries(voteCounts).forEach(([userId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerUserId = userId;
      }
    });
  }

  const winner = winnerUserId
    ? participants.find((p) => p.user_id === winnerUserId)
    : null;
  const winnerName = winner?.user?.name || winner?.user?.username || "Unknown";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {isCompleted ? "Voting Results" : "Vote for Winner"}
        </h3>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isCompleted && winner && maxVotes === totalParticipants && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-sm">
          <p className="font-semibold text-green-800 dark:text-green-200 text-base">
            🏆 Winner: {winnerName}
          </p>
          <p className="text-green-700 dark:text-green-300 mt-1">
            {winnerName} received 100% of votes ({maxVotes} / {totalParticipants}) and won the pot!
          </p>
        </div>
      )}

      {isCompleted && allVoted && (!winner || maxVotes < totalParticipants) && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-200 text-base">
            🤝 It's a tie!
          </p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            No unanimous winner. All participants have received their stake back.
          </p>
        </div>
      )}

      {allVoted && !allConfirmed && !isCompleted && (
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 text-sm">
          <p className="font-medium text-orange-800 dark:text-orange-200">
            ✓ All participants have voted!
          </p>
          <p className="text-orange-700 dark:text-orange-300 mt-1">
            Please confirm your vote by clicking "OK" below. Once all votes are confirmed, the winner will be determined.
          </p>
        </div>
      )}

      {allVoted && allConfirmed && !isCompleted && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            ✓ All votes confirmed!
          </p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            Processing results...
          </p>
          <ProcessingResults betId={betId} onComplete={() => window.location.reload()} />
        </div>
      )}

      {/* Also poll if user has confirmed their vote and all have voted, but not all confirmed yet */}
      {allVoted && !allConfirmed && userVoteConfirmed && !isCompleted && (
        <ProcessingResults betId={betId} onComplete={() => window.location.reload()} />
      )}

      {!allVoted && !isCompleted && totalVotes > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium">
            Votes cast: {totalVotes} / {totalParticipants}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            You can change your vote until everyone has voted.
          </p>
        </div>
      )}

      {!allVoted && !isCompleted && totalVotes === 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-muted-foreground">
            Vote for the winner. You can change your vote until everyone has voted.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {votableParticipants.map((participant) => {
          const isVotedFor = userVote === participant.user_id;
          const voteCount = voteCounts[participant.user_id] || 0;
          const isVoting = voting === participant.user_id;
          const participantName = participant.user?.name || participant.user?.username || "Unknown";

          return (
            <Card
              key={participant.id}
              onClick={() => !isVoting && !isCompleted && !userVoteConfirmed && handleToggleVote(participant.user_id)}
              className={cn(
                "transition-all",
                !isCompleted && "cursor-pointer active:scale-[0.98] hover:shadow-md",
                isCompleted && "cursor-default opacity-75",
                isVotedFor
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 border-2"
                  : "border",
                !isCompleted && !userVoteConfirmed && !isVotedFor && "hover:border-primary/50",
                (isVoting || isCompleted || userVoteConfirmed) && "cursor-not-allowed"
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  {/* Check icon or empty circle */}
                  <div className="relative">
                    {isVotedFor ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  {/* Participant name */}
                  <div>
                    <p className="font-medium text-base">
                      {participantName}
                      {participant.user_id === userId && (
                        <span className="text-xs text-muted-foreground ml-1">(You)</span>
                      )}
                    </p>
                  </div>

                  {/* Vote count */}
                  {voteCount > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {voteCount} vote{voteCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {/* Loading state */}
                  {isVoting && (
                    <p className="text-xs text-muted-foreground">Processing...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isCompleted && (
        <p className="text-xs text-muted-foreground text-center">
          Click on a participant to vote for them. Click again to revoke your vote.
        </p>
      )}

      {/* OK Button to confirm vote */}
      {allVoted && !isCompleted && userVote && !userVoteConfirmed && (
        <div className="flex justify-center pt-4">
          <button
            onClick={async () => {
              if (confirming || userVoteConfirmed) {
                console.log("[VotingSection] Confirm button clicked but already confirming or confirmed", { confirming, userVoteConfirmed });
                return;
              }
              
              console.log("[VotingSection] Starting vote confirmation...");
              setConfirming(true);
              setError("");
              
              try {
                console.log("[VotingSection] Calling confirmVote...");
                const result = await confirmVote(betId, userId);
                console.log("[VotingSection] confirmVote result:", result);
                
                if (!result.success) {
                  console.error("[VotingSection] confirmVote failed:", result.error);
                  setError(result.error || "Failed to confirm vote");
                  setConfirming(false);
                  return;
                }
                
                // Immediately set userVoteConfirmed to true to update the UI
                // This prevents the button from showing "Confirming..." forever
                console.log("[VotingSection] Setting userVoteConfirmed to true immediately");
                setUserVoteConfirmed(true);
                
                // Reload votes to get the latest state (including confirmed_at)
                // This will also ensure userVoteConfirmed is properly set
                console.log("[VotingSection] Reloading votes after confirmation...");
                // Small delay to ensure DB commit, then reload
                await new Promise(resolve => setTimeout(resolve, 400));
                await loadVotes();
                
                console.log("[VotingSection] Vote confirmed successfully, setting confirming to false");
                setConfirming(false);
                
                // Note: The ProcessingResults component will handle reloading when bet is completed
              } catch (err: any) {
                console.error("[VotingSection] Error confirming vote:", err);
                setError(err.message || "An unexpected error occurred");
                setConfirming(false);
              }
            }}
            disabled={confirming || userVoteConfirmed}
            className={cn(
              "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium min-h-[44px] flex items-center gap-2 transition-all",
              (confirming || userVoteConfirmed) && "opacity-50 cursor-not-allowed",
              !confirming && !userVoteConfirmed && "hover:bg-primary/90 active:scale-[0.98]"
            )}
          >
            {confirming ? (
              <>
                <span className="animate-spin">⏳</span>
                Confirming...
              </>
            ) : userVoteConfirmed ? (
              "Vote Confirmed"
            ) : (
              "OK - Confirm Vote"
            )}
          </button>
        </div>
      )}

      {allVoted && !isCompleted && userVote && userVoteConfirmed && (
        <div className="flex justify-center pt-4">
          <div className="px-6 py-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 font-medium min-h-[44px] flex items-center gap-2">
            <span>✓</span>
            <span>Your vote is confirmed</span>
          </div>
        </div>
      )}
    </div>
  );
}
