"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { FriendSelector } from "@/components/bet/FriendSelector";

type PrivacyOption = "public" | "private" | "friends_only";

interface SelectedUser {
  id: string;
  name: string | null;
  username: string;
}

export default function CreateBetPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stake, setStake] = useState("");
  const [deadline, setDeadline] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyOption>("public");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Get current user ID on mount
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    loadUser();
  }, []);

  // Generate random invite code
  const generateInviteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Quick deadline presets
  const setDeadlinePreset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    // Format as YYYY-MM-DD for date input
    const formattedDate = date.toISOString().split('T')[0];
    setDeadline(formattedDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a bet");
      setLoading(false);
      return;
    }

    const stakeAmount = parseInt(stake);

    // Validate inputs
    if (!title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (stakeAmount < 1) {
      setError("Stake must be at least 1 point");
      setLoading(false);
      return;
    }

    if (!deadline) {
      setError("Deadline is required");
      setLoading(false);
      return;
    }

    // Parse date and set time to end of day (23:59:59) for deadline
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(23, 59, 59, 999); // Set to end of day
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future");
      setLoading(false);
      return;
    }

    // Validate friends_only requires selected users
    if (privacy === "friends_only" && selectedUsers.length === 0) {
      setError("You must invite at least one friend for friends-only bets");
      setLoading(false);
      return;
    }

    // Generate invite code for private bets
    const inviteCode = privacy === "private" ? generateInviteCode() : null;

    // Prepare bet data
    const betData: any = {
      title: title.trim(),
      description: description.trim() || null,
      creator_id: user.id,
      stake_amount: stakeAmount,
      deadline: deadlineDate.toISOString(),
      status: "open",
      is_private: privacy !== "public",
    };

    // Only add invite_code if column exists (fallback if schema update not run yet)
    if (inviteCode) {
      betData.invite_code = inviteCode;
    }

    // Create bet
    const { data: bet, error: betError } = await supabase
      .from("bets")
      .insert(betData)
      .select()
      .single();

    if (betError) {
      setError(betError.message || "Failed to create bet");
      setLoading(false);
      return;
    }

    // Deduct points for creator using atomic function (prevents race conditions)
    const { data: deductResult, error: pointsError } = await supabase.rpc(
      "atomic_deduct_points",
      {
        p_user_id: user.id,
        p_amount: stakeAmount,
      }
    );

    if (pointsError) {
      setError("Failed to deduct points: " + pointsError.message);
      setLoading(false);
      return;
    }

    if (!deductResult || deductResult.length === 0 || !deductResult[0].success) {
      const errorMsg =
        deductResult?.[0]?.error_message || "You don't have enough points to create this bet";
      setError(errorMsg);
      setLoading(false);
      return;
    }

    // Add creator as participant (auto-accepted)
    const { error: participantError } = await supabase
      .from("bet_participants")
      .insert({
        bet_id: bet.id,
        user_id: user.id,
        status: "accepted",
      });

    if (participantError) {
      // Refund points if participant creation fails using atomic function
      await supabase.rpc("atomic_add_points", {
        p_user_id: user.id,
        p_amount: stakeAmount,
      });

      console.error("Error adding participant:", participantError);
      setError("Failed to add you as participant: " + participantError.message);
      setLoading(false);
      return;
    }

    // Log activity for bet creation
    const { logActivity } = await import("@/lib/actions/activities");
    await logActivity(
      user.id,
      "bet_created",
      `You created "${bet.title}"`,
      bet.id
    );

    // If friends_only, add selected friends as participants (pending status - they need to accept)
    if (privacy === "friends_only" && selectedUsers.length > 0) {
      const { inviteUsersToBet } = await import("@/lib/actions/betInvites");
      const inviteResult = await inviteUsersToBet(
        bet.id,
        selectedUsers.map((u) => u.id),
        user.id
      );

      if (!inviteResult.success) {
        // Show warning but still redirect
        console.warn("Failed to send invitations:", inviteResult.error);
      }
    }

    // Redirect to bet detail page
    router.push(`/bets/${bet.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Bet</h1>
        <p className="text-muted-foreground mt-1">
          Challenge your friends to a bet!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bet Details</CardTitle>
          <CardDescription>
            Fill in the details of your bet challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Burger Challenge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Describe the bet challenge in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="stake" className="text-sm font-medium">
                  Stake (Points) *
                </label>
                <Input
                  id="stake"
                  type="number"
                  placeholder="100"
                  min="1"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  required
                  disabled={loading}
                  className="min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Points you're willing to bet
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="deadline" className="text-sm font-medium">
                  Deadline *
                </label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  disabled={loading}
                  className="min-h-[44px]"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeadlinePreset(3)}
                    disabled={loading}
                    className="h-8 text-xs"
                  >
                    In 3 days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeadlinePreset(7)}
                    disabled={loading}
                    className="h-8 text-xs"
                  >
                    In 7 days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeadlinePreset(31)}
                    disabled={loading}
                    className="h-8 text-xs"
                  >
                    In 31 days
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  When should this bet end?
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="privacy" className="text-sm font-medium">
                Privacy *
              </label>
              <select
                id="privacy"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as PrivacyOption)}
                disabled={loading}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Only with invite link</option>
                <option value="friends_only">
                  Private - Only invited friends
                </option>
              </select>
              <p className="text-xs text-muted-foreground">
                {privacy === "public" &&
                  "Anyone can see and join this bet"}
                {privacy === "private" &&
                  "Only people with the invite link can join"}
                {privacy === "friends_only" &&
                  "Only friends you invite can join (select from your friends list)"}
              </p>
            </div>

            {/* Friend Selection - Only show for friends_only */}
            {privacy === "friends_only" && currentUserId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Invite Friends *
                </label>
                <FriendSelector
                  selectedUsers={selectedUsers}
                  onSelectionChange={setSelectedUsers}
                  currentUserId={currentUserId}
                  friendsOnly={true}
                />
                {privacy === "friends_only" && selectedUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Select at least one friend to invite
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-h-[44px] flex-1"
              >
                {loading ? "Creating..." : "Create Bet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

