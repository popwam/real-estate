"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateConversationStatus } from "@/hooks/use-admin-crm";
import type { ConversationStatus } from "@/types/admin-crm";

const statuses: ConversationStatus[] = ["OPEN", "CLOSED", "ARCHIVED"];

export function ConversationStatusUpdateDialog({ conversationId, currentStatus }: { conversationId: string; currentStatus: ConversationStatus }) {
  const [status, setStatus] = useState<ConversationStatus>(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const update = useUpdateConversationStatus(conversationId);
  async function submit() { await update.mutateAsync({ status, statusNote: statusNote || undefined }); setStatusNote(""); }
  return <div className="space-y-4"><label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">Status<select className="ui-input" value={status} onChange={(event) => { setStatus(event.target.value as ConversationStatus); update.reset(); }}>{statuses.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}</select></label><label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">Status note<Textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Optional reason or handoff note" /></label>{update.error ? <FeedbackState tone="error" title="Conversation status could not be updated" description={update.error.message} /> : null}{update.isSuccess ? <FeedbackState tone="success" title="Conversation status updated" /> : null}<Button className="w-full" disabled={update.isPending || (status === currentStatus && !statusNote.trim())} onClick={submit}>{update.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{update.isPending ? "Updating…" : "Update status"}</Button></div>;
}

function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
