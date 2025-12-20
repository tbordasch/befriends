"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Link as LinkIcon, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { acceptJoinRequest, declineJoinRequest } from "@/lib/actions/betJoinRequests";
import { useRouter } from "next/navigation";

interface JoinRequestCardProps {
  request: {
    id: string;
    betId: string;
    betTitle: string;
    betStake: number;
    userId: string;
    userName: string;
    userUsername: string;
  };
  creatorId: string;
  onAction?: () => void;
}

export function JoinRequestCard({ request, creatorId, onAction }: JoinRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    const result = await acceptJoinRequest(request.id, creatorId);
    if (!result.success) {
      setError(result.error || "Failed to accept join request");
    } else {
      router.refresh();
      if (onAction) onAction();
    }
    setLoading(false);
  };

  const handleDecline = async () => {
    setLoading(true);
    setError("");
    const result = await declineJoinRequest(request.id, creatorId);
    if (!result.success) {
      setError(result.error || "Failed to decline join request");
    } else {
      router.refresh();
      if (onAction) onAction();
    }
    setLoading(false);
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2.5 flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${request.userId}`}
                className="block group"
              >
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                  {request.userName}
                </h3>
                {request.userUsername && (
                  <p className="text-sm text-muted-foreground">@{request.userUsername}</p>
                )}
              </Link>
            </div>
          </div>

          {/* Bet Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Wants to join
            </p>
            <Link
              href={`/bets/${request.betId}`}
              className="block group"
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                <span className="font-semibold text-base group-hover:text-primary transition-colors">
                  {request.betTitle}
                </span>
              </div>
            </Link>
            <div className="pt-1 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                Stake: <span className="font-semibold text-foreground">{request.betStake.toLocaleString()} pts</span>
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 min-h-[44px]"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


