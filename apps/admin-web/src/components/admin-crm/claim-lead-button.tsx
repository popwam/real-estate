"use client";

import { useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";

export function ClaimLeadButton({ leadId, disabled, isPending, error, onClaim }: { leadId: string; disabled?: boolean; isPending?: boolean; error?: Error | null; onClaim: (id: string) => Promise<unknown> }) {
  const { t } = useI18n();

  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string>();
  const [localError, setLocalError] = useState<string>();

  async function claim() {
    setMessage(undefined);
    setLocalError(undefined);
    try {
      await onClaim(leadId);
      setMessage("Lead claimed successfully.");
      setConfirming(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setMessage("This lead is no longer available to claim.");
        setConfirming(false);
        return;
      }
      setLocalError(caught instanceof Error ? caught.message : "The lead could not be claimed.");
    }
  }

  if (confirming) {
    return <div className="min-w-56 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3"><p className="text-xs leading-5 text-[var(--color-warning)]">{t("adminSweep.claiming.assigns.this.marketplace.lead.to.your.e.096cdcd0")}</p><div className="mt-3 flex gap-2"><button type="button" className="ui-button ui-button-primary" disabled={isPending} onClick={claim}>{isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}{isPending ? "Claiming…" : "Confirm claim"}</button><button type="button" className="ui-button ui-button-secondary" disabled={isPending} onClick={() => setConfirming(false)}>{t("adminSweep.cancel.77dfd213")}</button></div></div>;
  }

  return <div className="space-y-2"><button type="button" className="ui-button ui-button-primary" disabled={disabled || isPending} onClick={() => setConfirming(true)}><ShieldCheck className="h-4 w-4" aria-hidden="true" />{t("adminSweep.claim.lead.e78671ee")}</button>{message ? <FeedbackState tone="success" title={message} /> : null}{localError || error ? <FeedbackState tone="error" title={t("adminSweep.lead.could.not.be.claimed.82b7454f")} description={localError ?? (error instanceof ApiError && error.status === 409 ? "This lead is no longer available to claim." : error?.message)} /> : null}</div>;
}
