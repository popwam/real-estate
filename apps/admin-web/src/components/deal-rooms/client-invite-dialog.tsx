"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClientInviteResponse } from "@/types/deal-rooms";
import { useI18n } from "@/i18n";

export function ClientInviteDialog({
  isPending,
  error,
  onInvite,
}: {
  isPending?: boolean;
  error?: Error | null;
  onInvite: () => Promise<ClientInviteResponse>;
}) {
  const { t } = useI18n();

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
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">{t("adminSweep.client.invite.creates.or.refreshes.the.client.pa.ad5aefbd")}</p>
      {result ? (
        <div className="ui-feedback ui-feedback-success flex gap-2 text-sm" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("adminSweep.client.participant.is.d83cf09f")}{result.participant.status}{t("adminSweep.delivery.06b8c065")}{result.invite.delivery}.</span>
        </div>
      ) : null}
      {error ? <p className="ui-feedback ui-feedback-error text-sm" role="alert">{error.message}</p> : null}
    </div>
  );
}
