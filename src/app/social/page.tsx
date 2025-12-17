import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, UserMinus, Users, Mail } from "lucide-react";
import { FriendsList } from "@/components/friends/FriendsList";
import { SearchUsers } from "@/components/friends/SearchUsers";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { InvitationsList } from "@/components/invitations/InvitationsList";
import { JoinRequestsList } from "@/components/social/JoinRequestsList";

export default async function SocialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

      {/* Join Requests (for bets you created) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Join Requests
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
            <Mail className="h-5 w-5" />
            Bet Invitations
          </CardTitle>
          <CardDescription>
            Pending bet invitations from friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationsList userId={user.id} />
        </CardContent>
      </Card>

      {/* Friend Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Friend Requests
          </CardTitle>
          <CardDescription>
            Manage incoming and outgoing friend requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FriendRequests userId={user.id} />
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Friends
          </CardTitle>
          <CardDescription>People you've added as friends</CardDescription>
        </CardHeader>
        <CardContent>
          <FriendsList userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

