"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FriendSelector } from "./FriendSelector";
import { inviteUsersToBet } from "@/lib/actions/betInvites";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

interface SelectedUser {
  id: string;
  name: string | null;
  username: string;
}

interface InviteFriendsButtonProps {
  betId: string;
  userId: string;
}

export function InviteFriendsButton({
  betId,
  userId,
}: InviteFriendsButtonProps) {
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const router = useRouter();

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select at least one friend to invite");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await inviteUsersToBet(
      betId,
      selectedUsers.map((u) => u.id),
      userId
    );

    if (!result.success) {
      setError(result.error || "Failed to send invitations");
      setLoading(false);
    } else {
      setSuccess(true);
      setSelectedUsers([]);
      setShowSelector(false);
      setLoading(false);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {!showSelector ? (
        <Button
          onClick={() => setShowSelector(true)}
          variant="outline"
          className="w-full min-h-[44px]"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Friends
        </Button>
      ) : (
        <div className="space-y-4 border rounded-lg p-4">
          <FriendSelector
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
            currentUserId={userId}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600">
              Invitations sent successfully!
            </p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowSelector(false);
                setSelectedUsers([]);
                setError("");
              }}
              variant="outline"
              disabled={loading}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || selectedUsers.length === 0}
              className="flex-1 min-h-[44px]"
            >
              {loading ? "Sending..." : `Send Invites (${selectedUsers.length})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

