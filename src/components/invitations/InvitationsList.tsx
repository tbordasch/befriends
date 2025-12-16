"use client";

import { useEffect, useState } from "react";
import { getPendingInvitations } from "@/lib/actions/invitations";
import { InvitationCard } from "./InvitationCard";
import { Card, CardContent } from "@/components/ui/card";

export function InvitationsList({ userId }: { userId: string }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvitations = async () => {
    setLoading(true);
    const result = await getPendingInvitations(userId);

    if (!result.success) {
      setError(result.error || "Failed to load invitations");
      setInvitations([]);
    } else {
      setInvitations(result.invitations || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      loadInvitations();
    }
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading invitations...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No pending invitations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          userId={userId}
          onAction={loadInvitations}
        />
      ))}
    </div>
  );
}

