"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";

export function CopyInviteLinkButton({
  inviteLink,
}: {
  inviteLink: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        readOnly
        value={inviteLink}
        className="min-h-[44px]"
      />
      <Button onClick={handleCopy} className="min-h-[44px]">
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  );
}

