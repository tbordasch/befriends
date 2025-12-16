"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { joinBet } from "@/lib/actions/bets";

function JoinBetButtonContent({
  betId,
  userId,
  inviteCode,
}: {
  betId: string;
  userId: string;
  inviteCode?: string;
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

    const result = await joinBet(betId, userId, inviteCodeFromUrl || undefined);

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
        disabled={loading}
        className="w-full min-h-[44px]"
      >
        {loading ? "Joining..." : "Join Bet"}
      </Button>
    </div>
  );
}

export function JoinBetButton({
  betId,
  userId,
  inviteCode,
}: {
  betId: string;
  userId: string;
  inviteCode?: string;
}) {
  return (
    <Suspense fallback={
      <Button disabled className="w-full min-h-[44px]">
        Loading...
      </Button>
    }>
      <JoinBetButtonContent betId={betId} userId={userId} inviteCode={inviteCode} />
    </Suspense>
  );
}

