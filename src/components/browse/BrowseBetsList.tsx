"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Coins, Users, User } from "lucide-react";
import { requestToJoinBet } from "@/lib/actions/betJoinRequests";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrowseBetsListProps {
  bets: any[];
  currentUserId: string;
}

export function BrowseBetsList({ bets, currentUserId }: BrowseBetsListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRequestJoin = async (betId: string) => {
    setLoading(betId);
    setError("");

    const result = await requestToJoinBet(betId, currentUserId);

    if (!result.success) {
      setError(result.error || "Failed to request join");
      setLoading(null);
    } else {
      router.refresh();
    }
  };

  // Calculate participant counts
  const betsWithParticipants = bets.map((bet) => {
    const acceptedParticipants = bet.participants?.filter(
      (p: any) => p.status === "accepted"
    ) || [];
    const pendingParticipants = bet.participants?.filter(
      (p: any) => p.status === "pending"
    ) || [];
    const totalParticipants = acceptedParticipants.length + pendingParticipants.length;
    const potSize = bet.stake_amount * Math.max(totalParticipants, 1);
    
    const isCreator = bet.creator?.id === currentUserId;
    const isParticipant = bet.participants?.some(
      (p: any) => p.user_id === currentUserId
    );
    const isPending = bet.participants?.some(
      (p: any) => p.user_id === currentUserId && p.status === "pending"
    );
    const isAccepted = bet.participants?.some(
      (p: any) => p.user_id === currentUserId && p.status === "accepted"
    );

    return {
      ...bet,
      acceptedCount: acceptedParticipants.length,
      pendingCount: pendingParticipants.length,
      totalParticipants,
      potSize,
      isCreator,
      isParticipant,
      isPending,
      isAccepted,
    };
  });

  // Calculate remaining days
  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (bets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {error || "No public bets found. Create one to get started!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {betsWithParticipants.map((bet) => {
          const daysRemaining = getDaysRemaining(bet.deadline);
          const creatorName = bet.creator?.name || bet.creator?.username || "Unknown";
          const creatorUsername = bet.creator?.username;

          return (
            <Card key={bet.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {bet.title}
                  </CardTitle>
                </div>
                {bet.description && (
                  <CardDescription className="line-clamp-2">
                    {bet.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 mb-4">
                  {/* Creator */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      {creatorName}
                      {creatorUsername && (
                        <span className="text-muted-foreground/70"> @{creatorUsername}</span>
                      )}
                    </span>
                  </div>

                  {/* Stake */}
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-medium">{bet.stake_amount.toLocaleString()} pts</span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {bet.acceptedCount} participant{bet.acceptedCount !== 1 ? "s" : ""}
                      {bet.pendingCount > 0 && (
                        <span className="text-muted-foreground">
                          {" "}+ {bet.pendingCount} pending
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Pot Size */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Pot:</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {bet.potSize.toLocaleString()} pts
                    </span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {daysRemaining > 0
                        ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`
                        : "Deadline passed"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t">
                  <Link href={`/bets/${bet.id}`} className="flex-1">
                    <Button variant="outline" className="w-full min-h-[44px]">
                      View Details
                    </Button>
                  </Link>
                  {bet.isCreator ? (
                    <Button disabled className="flex-1 min-h-[44px] opacity-50">
                      Your Bet
                    </Button>
                  ) : bet.isAccepted ? (
                    <Button disabled className="flex-1 min-h-[44px] opacity-50">
                      Joined
                    </Button>
                  ) : bet.isPending ? (
                    <Button disabled className="flex-1 min-h-[44px]">
                      Requested
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleRequestJoin(bet.id)}
                      disabled={loading === bet.id || loading !== null}
                      className="flex-1 min-h-[44px]"
                    >
                      {loading === bet.id ? "Requesting..." : "Request Join"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

