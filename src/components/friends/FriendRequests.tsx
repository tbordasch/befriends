"use client";

import { useEffect, useState } from "react";
import { getFriendRequests, acceptFriendRequest, declineFriendRequest } from "@/lib/actions/friendRequests";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, UserX, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function FriendRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadRequests = async () => {
    setLoading(true);
    const result = await getFriendRequests(userId);

    if (!result.success) {
      setError(result.error || "Failed to load friend requests");
      setRequests([]);
    } else {
      setRequests(result.requests || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      loadRequests();
    }
  }, [userId]);

  const handleAccept = async (requestId: string) => {
    setLoading(true);
    const result = await acceptFriendRequest(requestId, userId);

    if (!result.success) {
      setError(result.error || "Failed to accept friend request");
    } else {
      router.refresh();
      loadRequests();
    }
    setLoading(false);
  };

  const handleDecline = async (requestId: string) => {
    setLoading(true);
    const result = await declineFriendRequest(requestId, userId);

    if (!result.success) {
      setError(result.error || "Failed to decline friend request");
    } else {
      router.refresh();
      loadRequests();
    }
    setLoading(false);
  };

  if (loading && requests.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading friend requests...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const receivedRequests = requests.filter((r) => r.receiver_id === userId);
  const sentRequests = requests.filter((r) => r.requester_id === userId);

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No pending friend requests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Received Requests ({receivedRequests.length})
          </h3>
          <div className="space-y-2">
            {receivedRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {request.requester?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{request.requester?.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                        disabled={loading}
                        className="min-h-[44px]"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(request.id)}
                        disabled={loading}
                        className="min-h-[44px]"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Sent Requests ({sentRequests.length})
          </h3>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {request.receiver?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{request.receiver?.username}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Pending...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

