"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Achievement } from "@/lib/actions/achievements";
import { CheckCircle2 } from "lucide-react";

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <Card
      className={cn(
        "transition-all relative",
        achievement.unlocked
          ? "border-primary bg-primary/5"
          : "border-muted opacity-60 bg-muted/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-2">
          {achievement.unlocked && (
            <div className="absolute top-2 right-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="text-4xl">{achievement.icon}</div>
          <div>
            <p className="font-semibold text-sm">{achievement.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {achievement.description}
            </p>
          </div>
          {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
            <div className="w-full mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    achievement.unlocked ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  style={{
                    width: `${Math.min(
                      (achievement.progress / achievement.maxProgress) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {achievement.progress} / {achievement.maxProgress}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

