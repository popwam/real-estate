import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/admin-crm";

export function ConversationMessagesTimeline({ messages = [] }: { messages?: ConversationMessage[] }) {
  if (!messages.length) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
        No messages yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const isText = message.type === "TEXT";
        return (
          <li
            key={message.id}
            className={cn(
              "rounded-md border p-4",
              isText ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium uppercase text-zinc-500">{message.type.replaceAll("_", " ")}</div>
              <div className="text-xs text-zinc-400">{formatDate(message.createdAt)}</div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-900">{message.body}</p>
            <p className="mt-2 text-xs text-zinc-500">{senderLabel(message)}</p>
          </li>
        );
      })}
    </ol>
  );
}

function senderLabel(message: ConversationMessage) {
  if (message.sender?.displayName) return message.sender.displayName;
  if (message.sender?.publicRole) return message.sender.publicRole;
  return "System";
}
