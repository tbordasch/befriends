"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { deleteBet } from "@/lib/actions/bets";
import { Trash2, AlertTriangle, Coins, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DeleteBetButton({
  betId,
  userId,
}: {
  betId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [betInfo, setBetInfo] = useState<{
    title: string;
    stake_amount: number;
    participant_count: number;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!open || !betId) return;

    async function loadBetInfo() {
      setLoadingInfo(true);
      setError("");

      try {
        const { data: bet, error: betError } = await supabase
          .from("bets")
          .select("title, stake_amount")
          .eq("id", betId)
          .single();

        if (betError || !bet) {
          setError("Failed to load bet information");
          setLoadingInfo(false);
          return;
        }

        const { count, error: countError } = await supabase
          .from("bet_participants")
          .select("id", { count: "exact", head: true })
          .eq("bet_id", betId)
          .eq("status", "accepted");

        if (countError) {
          setError("Failed to load participant information");
          setLoadingInfo(false);
          return;
        }

        setBetInfo({
          title: bet.title,
          stake_amount: bet.stake_amount,
          participant_count: count || 0,
        });
        setLoadingInfo(false);
      } catch (err: any) {
        setError("Failed to load bet information");
        setLoadingInfo(false);
      }
    }

    loadBetInfo();
  }, [open, betId, supabase]);

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await deleteBet(betId, userId);

      if (!result.success) {
        setError(result.error || "Failed to delete bet");
        setLoading(false);
      } else {
        setOpen(false);
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const totalRefund = betInfo
    ? betInfo.stake_amount * betInfo.participant_count
    : 0;
  const userRefund = betInfo ? betInfo.stake_amount : 0;

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        disabled={loading}
        variant="destructive"
        className="min-h-[44px]"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Bet
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={loading}
        variant="destructive"
        className="min-h-[44px]"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Bet
      </Button>

      {/* Simple Modal Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={() => setOpen(false)}
      >
        <div
          className="bg-background rounded-lg border shadow-lg w-full max-w-md p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Delete Bet</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this bet? This action cannot be undone.
          </p>

          {/* Content */}
          {loadingInfo ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading bet information...
            </div>
          ) : betInfo ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Bet Title</p>
                  <p className="text-sm text-muted-foreground">{betInfo.title}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-3">What happens when you delete:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">You</span> will receive{" "}
                          <span className="font-semibold text-primary">
                            {userRefund.toLocaleString()} points
                          </span>{" "}
                          back
                        </p>
                      </div>
                    </div>

                    {betInfo.participant_count > 1 && (
                      <div className="flex items-start gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">
                              {betInfo.participant_count - 1} other participant
                              {betInfo.participant_count - 1 !== 1 ? "s" : ""}
                            </span>{" "}
                            will receive{" "}
                            <span className="font-semibold text-primary">
                              {betInfo.stake_amount.toLocaleString()} points
                            </span>{" "}
                            each back
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 mt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Total refund: <span className="font-medium">{totalRefund.toLocaleString()} points</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    All votes, proofs, and participant records will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || !betInfo}
              className="min-h-[44px]"
            >
              {loading ? "Deleting..." : "Delete Bet"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
