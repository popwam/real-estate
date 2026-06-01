"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateConversationStatus } from "@/hooks/use-admin-crm";
import type { ConversationStatus } from "@/types/admin-crm";

const statuses: ConversationStatus[] = ["OPEN", "CLOSED", "ARCHIVED"];

export function ConversationStatusUpdateDialog({ conversationId, currentStatus }: { conversationId: string; currentStatus: ConversationStatus }) {
  const [status, setStatus] = useState<ConversationStatus>(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const update = useUpdateConversationStatus(conversationId);

  async function submit() {
    await update.mutateAsync({ status, statusNote: statusNote || undefined });
    setStatusNote("");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="space-y-2 text-sm font-medium text-zinc-800">
          Status
          <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as ConversationStatus)}>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-zinc-800">
          Status note
          <Textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Optional note for this status change." />
        </label>
      </div>
      {update.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{update.error.message}</p> : null}
      {update.isSuccess ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Conversation status updated.</p> : null}
      <Button disabled={update.isPending} onClick={submit}>{update.isPending ? "Updating" : "Update conversation status"}</Button>
      <p className="text-sm text-zinc-500">No WebSocket or external chat provider is called.</p>
    </div>
  );
}
