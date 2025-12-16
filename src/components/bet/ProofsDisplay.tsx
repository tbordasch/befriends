"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, User } from "lucide-react";

interface Proof {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
  };
}

interface ProofsDisplayProps {
  proofs: Proof[];
}

export function ProofsDisplay({ proofs }: ProofsDisplayProps) {
  if (proofs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Proofs</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {proofs.map((proof) => (
          <Card key={proof.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {proof.user?.name || proof.user?.username || "Unknown"}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(proof.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={proof.image_url}
                  alt={`Proof by ${proof.user?.name || "user"}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

