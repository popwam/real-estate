"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClientInviteResponse } from "@/types/deal-rooms";

export function ClientInviteDialog({
  isPending,
  error,
  onInvite,
}: {
  isPending?: boolean;
  error?: Error | null;
  onInvite: () => Promise<ClientInviteResponse>;
}) {
  const [result, setResult] = useState<ClientInviteResponse | null>(null);

  async function invite() {
    const response = await onInvite();
    setResult(response);
  }

  return (
    <div className="space-y-3">
      <Button disabled={isPending} onClick={invite}>
        <Send className="h-4 w-4" />
        {isPending ? "Inviting" : "Invite client"}
      </Button>
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">
        Client invite creates or refreshes the client participant. External SMS/email delivery is a placeholder and is not implemented yet.
      </p>
      {result ? (
        <div className="ui-feedback ui-feedback-success flex gap-2 text-sm" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Client participant is {result.participant.status}. Delivery: {result.invite.delivery}.</span>
        </div>
      ) : null}
      {error ? <p className="ui-feedback ui-feedback-error text-sm" role="alert">{error.message}</p> : null}
    </div>
  );
}
