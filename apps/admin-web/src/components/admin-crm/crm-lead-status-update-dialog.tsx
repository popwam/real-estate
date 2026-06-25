"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCrmLeadStatus } from "@/hooks/use-admin-crm";
import type { CrmLeadStatus } from "@/types/admin-crm";

const statuses: CrmLeadStatus[] = ["NEW", "CLAIMED", "IN_CONVERSATION", "QUALIFIED", "LOST", "CONVERTED", "SPAM"];

export function CrmLeadStatusUpdateDialog({ leadId, currentStatus }: { leadId: string; currentStatus: CrmLeadStatus }) {
  const [status, setStatus] = useState<CrmLeadStatus>(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const update = useUpdateCrmLeadStatus(leadId);
  async function submit() { await update.mutateAsync({ status, statusNote: statusNote || undefined }); setStatusNote(""); }

  return <div className="space-y-4"><label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">Status<select className="ui-input" value={status} onChange={(event) => { setStatus(event.target.value as CrmLeadStatus); update.reset(); }}>{statuses.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}</select></label><label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">Status note<Textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Optional business context for this change" /></label>{update.error ? <FeedbackState tone="error" title="Lead status could not be updated" description={update.error.message} /> : null}{update.isSuccess ? <FeedbackState tone="success" title="Lead status updated" /> : null}<Button className="w-full" disabled={update.isPending || (status === currentStatus && !statusNote.trim())} onClick={submit}>{update.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{update.isPending ? "Updating…" : "Update lead status"}</Button></div>;
}

function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
