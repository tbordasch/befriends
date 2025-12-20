"use client";

import { useEffect, useState } from "react";
import { getJoinRequestsForCreator } from "@/lib/actions/betJoinRequests";
import { useRouter } from "next/navigation";
import { JoinRequestCard } from "./JoinRequestCard";

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
      setRequests(result.requests || []);
    }
    setLoading(false);
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
      {requests.map((request) => (
        <JoinRequestCard
          key={request.id}
          request={request}
          creatorId={creatorId}
          onAction={loadRequests}
        />
      ))}
    </div>
  );
}

