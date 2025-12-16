"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import { searchUsersByUsername } from "@/lib/actions/friends";
import { sendFriendRequest } from "@/lib/actions/friendRequests";
import { useRouter } from "next/navigation";

export function SearchUsers({ currentUserId }: { currentUserId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }

    setLoading(true);
    setError("");
    const result = await searchUsersByUsername(searchQuery, currentUserId);

    if (!result.success) {
      setError(result.error || "Failed to search users");
      setUsers([]);
    } else {
      setUsers(result.users || []);
    }
    setLoading(false);
  };

  const handleAddFriend = async (friendId: string) => {
    setLoading(true);
    const result = await sendFriendRequest(currentUserId, friendId);

    if (!result.success) {
      setError(result.error || "Failed to send friend request");
    } else {
      router.refresh();
      // Remove from search results
      setUsers(users.filter((u) => u.id !== friendId));
      setError(""); // Clear any previous errors
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="min-h-[44px]"
          disabled={loading}
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="min-h-[44px]"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {users.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Search Results</h3>
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg bg-accent"
            >
              <div>
                <p className="font-medium">{user.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleAddFriend(user.id)}
                disabled={loading}
                className="min-h-[44px]"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </div>
          ))}
        </div>
      )}

      {searchQuery && users.length === 0 && !loading && !error && (
        <p className="text-sm text-muted-foreground">No users found</p>
      )}
    </div>
  );
}

