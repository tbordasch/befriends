"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Coins, User, CheckCircle2, XCircle } from "lucide-react";
import { acceptInvitation, declineInvitation } from "@/lib/actions/invitations";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BetInvitationCardProps {
  invitation: any;
  userId: string;
  onAction?: () => void;
}

export function BetInvitationCard({ invitation, userId, onAction }: BetInvitationCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const bet = invitation.bet;
  const creator = bet?.creator;

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    
    const result = await acceptInvitation(userId, invitation.id);
    
    if (!result.success) {
      setError(result.error || "Failed to accept invitation");
      setLoading(false);
    } else {
      router.refresh();
      if (onAction) onAction();
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setError("");
    
    const result = await declineInvitation(userId, invitation.id);
    
    if (!result.success) {
      setError(result.error || "Failed to decline invitation");
      setLoading(false);
    } else {
      router.refresh();
      if (onAction) onAction();
    }
  };

  if (!bet) return null;

  const creatorName = creator?.name || creator?.username || "Unknown";

  return (
    <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/30">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Bet Title & Description */}
          <div>
            <h3 className="text-lg font-semibold mb-1">{bet.title}</h3>
            {bet.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{bet.description}</p>
            )}
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">
              Invited by <span className="font-medium text-foreground">{creatorName}</span>
            </span>
          </div>

          {/* Bet Details */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Stake</p>
                  <p className="font-semibold">{bet.stake_amount.toLocaleString()} pts</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-semibold text-sm">
                    {new Date(bet.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
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
              className="flex-1 min-h-[44px]"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept Invitation
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


