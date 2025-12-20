"use client";

import { useEffect, useState } from "react";
import { getUserActivities, Activity } from "@/lib/actions/activities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock as ActivityIcon, Trophy, UserPlus, XCircle, CheckCircle2, Plus, Users, Mail, Award, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  userId: string;
}

const activityIcons: Record<string, any> = {
  bet_created: Plus,
  bet_invited: Mail,
  bet_invitation_accepted: CheckCircle2,
  bet_invitation_declined: XCircle,
  join_request_sent: UserPlus,
  join_request_accepted: CheckCircle2,
  join_request_declined: XCircle,
  bet_won: Trophy,
  bet_tied: Users,
  friend_request_sent: Mail,
  friend_request_accepted: CheckCircle2,
  friend_request_declined: XCircle,
  friend_removed: UserPlus,
  friend_added: UserPlus,
  bet_joined: Plus,
  achievement_unlocked: Award,
  bet_deleted: Trash2,
};

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    setLoading(true);
    const result = await getUserActivities(userId, 50);

    if (!result.success) {
      setError(result.error || "Failed to load activities");
      setActivities([]);
    } else {
      setActivities(result.activities || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ActivityIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground font-medium">No activities yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your activity feed will appear here</p>
        </CardContent>
      </Card>
    );
  }

  // Determine the appropriate link for an activity
  const getActivityLink = (activity: Activity): string | null => {
    // Bet deletion doesn't link anywhere (bet no longer exists)
    if (activity.activity_type === "bet_deleted") {
      return null;
    }

    // Bet-related activities: link to the bet
    const betRelatedTypes = [
      "bet_created",
      "bet_invited",
      "bet_invitation_accepted",
      "bet_invitation_declined",
      "join_request_sent",
      "join_request_accepted",
      "join_request_declined",
      "bet_won",
      "bet_tied",
      "bet_joined",
    ];
    
    if (betRelatedTypes.includes(activity.activity_type)) {
      if (activity.related_bet_id) {
        return `/bets/${activity.related_bet_id}`;
      }
      // No bet ID, but still bet-related - go to social
      return "/social";
    }

    // Friend-related activities
    const friendRelatedTypes = [
      "friend_request_sent",
      "friend_request_accepted",
      "friend_request_declined",
      "friend_added",
      "friend_removed",
    ];

    if (friendRelatedTypes.includes(activity.activity_type)) {
      // "Becoming friends" activities link to the friend's profile
      if (
        (activity.activity_type === "friend_added" || 
         activity.activity_type === "friend_request_accepted") &&
        activity.related_user_id
      ) {
        return `/profile/${activity.related_user_id}`;
      }
      // Other friend activities go to social
      return "/social";
    }

    // Achievement-related activities: link to profile
    if (activity.activity_type === "achievement_unlocked") {
      return "/profile";
    }

    // Default: no link
    return null;
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.activity_type] || ActivityIcon;
        const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
        const linkHref = getActivityLink(activity);

        const content = (
          <>
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className={linkHref ? "font-medium text-primary" : ""}>
                  {activity.message}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
            </div>
          </>
        );

        if (linkHref) {
          return (
            <Link
              key={activity.id}
              href={linkHref}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]"
              )}
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

