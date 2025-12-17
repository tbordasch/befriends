"use client";

import { useEffect, useState } from "react";
import { getJoinRequestsForCreator, acceptJoinRequest, declineJoinRequest } from "@/lib/actions/betJoinRequests";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function JoinRequestsList({ creatorId }: { creatorId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadRequests();
  }, [creatorId]);

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    const result = await getJoinRequestsForCreator(creatorId);

    if (!result.success) {
      setError(result.error || "Failed to load join requests");
      setRequests([]);
    } else {
      console.log("Join Requests loaded:", result.requests);
      setRequests(result.requests || []);
    }
    setLoading(false);
  };

  const handleAccept = async (requestId: string) => {
    setProcessing(requestId);
    setError("");

    const result = await acceptJoinRequest(requestId, creatorId);

    if (!result.success) {
      setError(result.error || "Failed to accept join request");
      setProcessing(null);
    } else {
      router.refresh();
      loadRequests();
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessing(requestId);
    setError("");

    const result = await declineJoinRequest(requestId, creatorId);

    if (!result.success) {
      setError(result.error || "Failed to decline join request");
      setProcessing(null);
    } else {
      router.refresh();
      loadRequests();
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading join requests...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No pending join requests
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.length > 0 && (
        <p className="text-xs text-muted-foreground mb-2">
          {requests.length} pending request{requests.length !== 1 ? "s" : ""}
        </p>
      )}
      {requests.map((request) => {
        const userName = request.userName || request.userUsername || "Unknown";
        const userUsername = request.userUsername;
        const isProcessingThis = processing === request.id;

        return (
          <Card key={request.id} className="border-2">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/profile/${request.userId}`}
                      className="font-medium hover:underline"
                    >
                      {userName}
                      {userUsername && (
                        <span className="text-muted-foreground ml-1">@{userUsername}</span>
                      )}
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    wants to join
                  </p>
                  <Link
                    href={`/bets/${request.betId}`}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {request.betTitle}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stake: {request.betStake.toLocaleString()} pts
                  </p>
                </div>
                <div className="flex flex-row gap-2 shrink-0 items-center">
                  {/* Accept Button - Always visible */}
                  <Button
                    size="sm"
                    onClick={() => {
                      console.log("Accept clicked for request:", request.id);
                      handleAccept(request.id);
                    }}
                    disabled={isProcessingThis}
                    className="min-h-[44px] px-4 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 whitespace-nowrap flex items-center justify-center"
                    type="button"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  {/* Decline Button - Always visible */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log("Decline clicked for request:", request.id);
                      handleDecline(request.id);
                    }}
                    disabled={isProcessingThis}
                    className="min-h-[44px] px-4 disabled:opacity-50 whitespace-nowrap flex items-center justify-center"
                    type="button"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

