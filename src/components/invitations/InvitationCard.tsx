"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Coins } from "lucide-react";
import { acceptInvitation, declineInvitation } from "@/lib/actions/invitations";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface InvitationCardProps {
  invitation: any;
  userId: string;
  onAction?: () => void;
}

export function InvitationCard({ invitation, userId, onAction }: InvitationCardProps) {
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

  return (
    <div className="space-y-4">
        {bet.title && (
          <p className="text-base font-medium">{bet.title}</p>
        )}
        {bet.description && (
          <p className="text-sm text-muted-foreground">{bet.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium">{bet.stake_amount} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(bet.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 min-h-[44px]"
          >
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 min-h-[44px]"
          >
            Decline
          </Button>
        </div>
    </div>
  );
}

