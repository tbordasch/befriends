"use client";

import { useEffect, useState } from "react";
import { getUserFriends, removeFriend } from "@/lib/actions/friends";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";

export function FriendsList({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadFriends();
  }, [userId]);

  const loadFriends = async () => {
    setLoading(true);
    const result = await getUserFriends(userId);

    if (!result.success) {
      setError(result.error || "Failed to load friends");
      setFriends([]);
    } else {
      setFriends(result.friends || []);
    }
    setLoading(false);
  };

  const handleRemoveFriend = async (friendId: string) => {
    setLoading(true);
    const result = await removeFriend(userId, friendId);

    if (!result.success) {
      setError(result.error || "Failed to remove friend");
    } else {
      router.refresh();
      setFriends(friends.filter((f) => f.id !== friendId));
    }
    setLoading(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading friends...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (friends.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No friends yet. Search for users above to add friends!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between p-3 rounded-lg bg-accent"
        >
          <div>
            <p className="font-medium">{friend.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">@{friend.username}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveFriend(friend.id)}
            disabled={loading}
            className="min-h-[44px]"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}

