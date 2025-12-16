"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, X, Users } from "lucide-react";
import { searchUsersByUsername, getUserFriends } from "@/lib/actions/friends";

interface SelectedUser {
  id: string;
  name: string | null;
  username: string;
}

interface FriendSelectorProps {
  selectedUsers: SelectedUser[];
  onSelectionChange: (users: SelectedUser[]) => void;
  currentUserId: string;
  friendsOnly?: boolean; // If true, only show friends list (no username search)
}

export function FriendSelector({
  selectedUsers,
  onSelectionChange,
  currentUserId,
  friendsOnly = false,
}: FriendSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFriends, setShowFriends] = useState(true); // Show by default

  useEffect(() => {
    loadFriends();
  }, [currentUserId]);

  const loadFriends = async () => {
    const result = await getUserFriends(currentUserId);
    if (result.success && result.friends) {
      setFriends(result.friends);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const result = await searchUsersByUsername(searchQuery, currentUserId);

    if (result.success && result.users) {
      // Filter out already selected users
      const selectedIds = selectedUsers.map((u) => u.id);
      setSearchResults(
        result.users.filter((u) => !selectedIds.includes(u.id))
      );
    }
    setLoading(false);
  };

  const addUser = (user: any) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      onSelectionChange([
        ...selectedUsers,
        {
          id: user.id,
          name: user.name,
          username: user.username,
        },
      ]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeUser = (userId: string) => {
    onSelectionChange(selectedUsers.filter((u) => u.id !== userId));
  };

  const availableFriends = friends.filter(
    (f) => !selectedUsers.some((u) => u.id === f.id)
  );

  return (
    <div className="space-y-4">
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Users</label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm"
              >
                <span>
                  {user.name || "Unknown"} (@{user.username})
                </span>
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search by Username - Only show if not friendsOnly */}
      {!friendsOnly && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Search by Username</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) {
                  handleSearch();
                } else {
                  setSearchResults([]);
                }
              }}
              className="min-h-[44px]"
              disabled={loading}
            />
            <Button
              type="button"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              variant="outline"
              className="min-h-[44px]"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-1 border rounded-lg p-2 max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => addUser(user)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {user.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <UserPlus className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friends List */}
      {availableFriends.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Friends
            </label>
            {!friendsOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFriends(!showFriends)}
                className="min-h-[44px]"
              >
                {showFriends ? "Hide" : "Show"} ({availableFriends.length})
              </Button>
            )}
          </div>

          {(showFriends || friendsOnly) && (
            <div className="space-y-1 border rounded-lg p-2 max-h-48 overflow-y-auto">
              {availableFriends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => addUser(friend)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {friend.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{friend.username}
                    </p>
                  </div>
                  <UserPlus className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

