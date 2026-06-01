"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export function ClaimLeadButton({
  leadId,
  disabled,
  isPending,
  error,
  onClaim,
}: {
  leadId: string;
  disabled?: boolean;
  isPending?: boolean;
  error?: Error | null;
  onClaim: (id: string) => Promise<unknown>;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function claim() {
    setMessage(null);
    try {
      await onClaim(leadId);
      setMessage("Lead claimed.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setMessage("This lead has already been claimed.");
        return;
      }
      throw err;
    }
  }

  return (
    <div className="space-y-2">
      <Button disabled={disabled || isPending} onClick={claim}>
        {isPending ? "Claiming" : "Claim lead"}
      </Button>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      {error ? (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error instanceof ApiError && error.status === 409 ? "This lead has already been claimed." : error.message}</span>
        </div>
      ) : null}
    </div>
  );
}
