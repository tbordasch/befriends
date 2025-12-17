"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { joinBet } from "@/lib/actions/bets";
import { requestToJoinBet } from "@/lib/actions/betJoinRequests";

function JoinBetButtonContent({
  betId,
  userId,
  inviteCode,
  isPrivate,
  hasPendingRequest,
}: {
  betId: string;
  userId: string;
  inviteCode?: string;
  isPrivate?: boolean;
  hasPendingRequest?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get invite code from URL if not provided as prop
  const inviteCodeFromUrl = searchParams.get("invite") || inviteCode;

  const handleJoin = async () => {
    setLoading(true);
    setError("");

    // For private bets with invite code: use direct join
    // For public bets: use request system (creator must accept)
    let result;
    if (isPrivate && inviteCodeFromUrl) {
      result = await joinBet(betId, userId, inviteCodeFromUrl);
    } else if (!isPrivate) {
      result = await requestToJoinBet(betId, userId);
    } else {
      setError("This bet requires an invite code to join");
      setLoading(false);
      return;
    }

    if (!result.success) {
      setError(result.error || "Failed to join bet");
      setLoading(false);
    } else {
      // Remove invite parameter from URL after successful join
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("invite");
      const newUrl = newSearchParams.toString() 
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;
      router.push(newUrl);
      router.refresh();
    }
  };

  return (
    <div>
      {error && (
        <p className="text-sm text-destructive mb-2">{error}</p>
      )}
      <Button
        onClick={handleJoin}
        disabled={loading || hasPendingRequest}
        className="w-full min-h-[44px]"
      >
        {loading 
          ? (isPrivate && inviteCodeFromUrl ? "Joining..." : "Requesting...") 
          : hasPendingRequest
          ? "Requested"
          : (isPrivate && inviteCodeFromUrl ? "Join Bet" : "Request to Join")}
      </Button>
    </div>
  );
}

export function JoinBetButton({
  betId,
  userId,
  inviteCode,
  isPrivate,
  hasPendingRequest,
}: {
  betId: string;
  userId: string;
  inviteCode?: string;
  isPrivate?: boolean;
  hasPendingRequest?: boolean;
}) {
  return (
    <Suspense fallback={
      <Button disabled className="w-full min-h-[44px]">
        Loading...
      </Button>
    }>
      <JoinBetButtonContent betId={betId} userId={userId} inviteCode={inviteCode} isPrivate={isPrivate} hasPendingRequest={hasPendingRequest} />
    </Suspense>
  );
}

