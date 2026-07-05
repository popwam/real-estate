"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCrmLeadStatus } from "@/hooks/use-admin-crm";
import type { CrmLeadStatus } from "@/types/admin-crm";
import { useI18n } from "@/i18n";

const statuses: CrmLeadStatus[] = ["NEW", "CLAIMED", "IN_CONVERSATION", "QUALIFIED", "LOST", "CONVERTED", "SPAM"];

export function CrmLeadStatusUpdateDialog({ leadId, currentStatus }: { leadId: string; currentStatus: CrmLeadStatus }) {
  const { t } = useI18n();

  const [status, setStatus] = useState<CrmLeadStatus>(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const update = useUpdateCrmLeadStatus(leadId);
  async function submit() { await update.mutateAsync({ status, statusNote: statusNote || undefined }); setStatusNote(""); }

  return <div className="space-y-4"><label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{t("adminSweep.status.bae7d5be")}<select className="ui-input" value={status} onChange={(event) => { setStatus(event.target.value as CrmLeadStatus); update.reset(); }}>{statuses.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}</select></label><label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{t("adminSweep.status.note.dc2f8f3c")}<Textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder={t("adminSweep.optional.business.context.for.this.change.e2e12b0b")} /></label>{update.error ? <FeedbackState tone="error" title={t("adminSweep.lead.status.could.not.be.updated.2a966f5b")} description={update.error.message} /> : null}{update.isSuccess ? <FeedbackState tone="success" title={t("adminSweep.lead.status.updated.3b7c10cd")} /> : null}<Button className="w-full" disabled={update.isPending || (status === currentStatus && !statusNote.trim())} onClick={submit}>{update.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{update.isPending ? "Updating…" : "Update lead status"}</Button></div>;
}

function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
