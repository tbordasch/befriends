"use client";

import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PointsDisplayProps {
  available: number;
  locked: number;
  potentialWin?: number;
  variant?: "sidebar" | "dashboard";
}

export function PointsDisplay({
  available,
  locked,
  potentialWin = 0,
  variant = "dashboard",
}: PointsDisplayProps) {
  // Points = Available + In Bets (always calculate from available + locked)
  const total = available + locked;

  if (variant === "sidebar") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-sidebar-accent/50">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-sidebar-foreground" />
            <span className="text-sm font-medium text-sidebar-foreground">
              Points
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-sidebar-foreground">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="px-3 space-y-1 text-xs">
          <div className="flex justify-between text-sidebar-foreground/80">
            <span>Available</span>
            <span className="font-medium">{available.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sidebar-foreground/60">
            <span>In Bets</span>
            <span className="font-medium">{locked.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sidebar-foreground/70">
            <span>Potential Win</span>
            <span className="font-medium">{potentialWin.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Points</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-bold">{total.toLocaleString()}</span>
            <div className="flex gap-3 text-xs mt-1">
              <span className="text-muted-foreground">
                Available: {available.toLocaleString()}
              </span>
              <span className="text-muted-foreground/70">
                In Bets: {locked.toLocaleString()}
              </span>
              <span className="text-muted-foreground/70">
                Potential Win: {potentialWin.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

