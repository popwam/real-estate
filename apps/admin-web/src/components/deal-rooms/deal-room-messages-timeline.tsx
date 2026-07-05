"use client";

import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DealRoomMessage } from "@/types/deal-rooms";
import { useI18n } from "@/i18n";

export function DealRoomMessagesTimeline({ messages = [] }: { messages?: DealRoomMessage[] }) {
  const { t } = useI18n();

  if (!messages.length) {
    return (
      <div className="ui-empty-state">
        <p>{t("adminSweep.no.negotiation.messages.yet.start.the.discussion.66b0736c")}</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {messages.map((message) => (
        <li key={message.id} className={cn("rounded-[var(--radius-lg)] border p-4", message.messageType === "TEXT" ? "border-[var(--color-border)] bg-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-surface-muted)]")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase text-[var(--color-text-muted)]">{message.messageType.replace("_", " ")}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{formatDate(message.createdAt)}</div>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">{message.body}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">{senderLabel(message)}</p>
        </li>
      ))}
    </ol>
  );
}

function senderLabel(message: DealRoomMessage) {
  if (message.senderUser) {
    return [message.senderUser.firstName, message.senderUser.lastName].filter(Boolean).join(" ") ||
      message.senderUser.email;
  }
  if (message.senderClient) return message.senderClient.name ?? "Client";
  return "System";
}
