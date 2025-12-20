import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Mail, Users } from "lucide-react";
import { FriendsList } from "@/components/friends/FriendsList";
import { SearchUsers } from "@/components/friends/SearchUsers";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { InvitationsList } from "@/components/invitations/InvitationsList";
import { JoinRequestsList } from "@/components/social/JoinRequestsList";
import { getPendingInvitations } from "@/lib/actions/invitations";
import { getFriendRequests } from "@/lib/actions/friendRequests";
import { getJoinRequestsForCreator } from "@/lib/actions/betJoinRequests";
import { NotificationBadge } from "@/components/social/NotificationBadge";

export default async function SocialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch counts for badges
  const [invitationsResult, friendRequestsResult, joinRequestsResult] = await Promise.all([
    getPendingInvitations(user.id),
    getFriendRequests(user.id),
    getJoinRequestsForCreator(user.id),
  ]);

  const invitationsCount = invitationsResult.success ? invitationsResult.invitations?.length || 0 : 0;
  const friendRequestsCount = friendRequestsResult.success 
    ? friendRequestsResult.requests?.filter((r: any) => r.receiver_id === user.id).length || 0 
    : 0;
  const joinRequestsCount = joinRequestsResult.success ? joinRequestsResult.requests?.length || 0 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social</h1>
        <p className="text-muted-foreground mt-1">
          Find and manage your friends, and view join requests
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>
            Search for users by username to add them as friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchUsers currentUserId={user.id} />
        </CardContent>
      </Card>

      {/* Join Requests & Bet Invitations - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Join Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Join Requests
              {joinRequestsCount > 0 && (
                <NotificationBadge count={joinRequestsCount} />
              )}
            </CardTitle>
            <CardDescription>
              People requesting to join your public bets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRequestsList creatorId={user.id} />
          </CardContent>
        </Card>

        {/* Bet Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Bet Invitations
              {invitationsCount > 0 && (
                <NotificationBadge count={invitationsCount} />
              )}
            </CardTitle>
            <CardDescription>
              Pending bet invitations from friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsList userId={user.id} />
          </CardContent>
        </Card>
      </div>

      {/* Friends & Friend Requests - Combined Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends & Requests
            {friendRequestsCount > 0 && (
              <NotificationBadge count={friendRequestsCount} />
            )}
          </CardTitle>
          <CardDescription>
            Manage your friends and friend requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Friend Requests Section */}
          {friendRequestsCount > 0 && (
            <div className="space-y-3 pb-6 border-b">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Friend Requests
                <NotificationBadge count={friendRequestsCount} />
              </h3>
              <FriendRequests userId={user.id} />
            </div>
          )}

          {/* Friends List Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Friends
            </h3>
            <FriendsList userId={user.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
