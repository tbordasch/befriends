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
import { FriendSelector } from "./FriendSelector";
import { inviteUsersToBet } from "@/lib/actions/betInvites";
import type { Bet } from "@/types/database";

interface SelectedUser {
  id: string;
  name: string | null;
  username: string;
}

type PrivacyOption = "public" | "private" | "friends_only";

export function EditBetForm({ bet }: { bet: Bet }) {
  const [title, setTitle] = useState(bet.title);
  const [description, setDescription] = useState(bet.description || "");
  const [stake, setStake] = useState(bet.stake_amount.toString());
  const [deadline, setDeadline] = useState(
    new Date(bet.deadline).toISOString().slice(0, 16)
  );
  const [privacy, setPrivacy] = useState<PrivacyOption>(
    // If bet has invite_code and is private, it could be either "private" or "friends_only"
    // We default to "private" for now, user can change it
    bet.is_private ? "private" : "public"
  );
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future");
      setLoading(false);
      return;
    }

    // Generate invite code for private bets (via link) if needed
    let inviteCode = (bet as any).invite_code;
    if (privacy === "private" && !inviteCode) {
      inviteCode = generateInviteCode();
    }
    // For friends_only, we don't need an invite code
    if (privacy === "friends_only" && inviteCode) {
      inviteCode = null; // Remove invite code for friends_only bets
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      description: description.trim() || null,
      stake_amount: stakeAmount,
      deadline: deadlineDate.toISOString(),
      is_private: privacy !== "public",
    };

    // Only add invite_code if we have one (or if column exists)
    if (inviteCode) {
      updateData.invite_code = inviteCode;
    }

    // Update bet
    const { error: updateError } = await supabase
      .from("bets")
      .update(updateData)
      .eq("id", bet.id);

    if (updateError) {
      setError(updateError.message || "Failed to update bet");
      setLoading(false);
      return;
    }

    // If friends_only and users selected, invite them
    if (privacy === "friends_only" && selectedUsers.length > 0) {
      const inviteResult = await inviteUsersToBet(
        bet.id,
        selectedUsers.map((u) => u.id),
        bet.creator_id
      );

      if (!inviteResult.success) {
        setError(
          `Bet updated, but failed to send invitations: ${inviteResult.error || "Unknown error"}`
        );
        setLoading(false);
        return;
      }
    }

    // Redirect to bet detail page
    router.push(`/bets/${bet.id}`);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bet Details</CardTitle>
        <CardDescription>Update the details of your bet challenge</CardDescription>
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
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                disabled={loading}
                className="min-h-[44px]"
              />
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
              {privacy === "public" && "Anyone can see and join this bet"}
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
                Invite Additional Friends
              </label>
              <FriendSelector
                selectedUsers={selectedUsers}
                onSelectionChange={setSelectedUsers}
                currentUserId={currentUserId}
                friendsOnly={true}
              />
              <p className="text-xs text-muted-foreground">
                Select friends to invite to this bet
              </p>
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

