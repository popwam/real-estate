import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DealRoomMessage } from "@/types/deal-rooms";

export function DealRoomMessagesTimeline({ messages = [] }: { messages?: DealRoomMessage[] }) {
  if (!messages.length) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
        No messages yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {messages.map((message) => (
        <li key={message.id} className={cn("rounded-md border p-4", message.messageType === "TEXT" ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase text-zinc-500">{message.messageType}</div>
            <div className="text-xs text-zinc-400">{formatDate(message.createdAt)}</div>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-900">{message.body}</p>
          <p className="mt-2 text-xs text-zinc-500">{senderLabel(message)}</p>
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
