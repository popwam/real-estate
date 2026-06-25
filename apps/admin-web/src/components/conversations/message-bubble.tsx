import { formatDate } from "@/lib/format";
import type { ConversationMessage } from "@/types/admin-crm";

export function MessageBubble({ message }: { message: ConversationMessage }) {
  const role = message.sender?.publicRole ?? "SYSTEM";
  const system = role === "SYSTEM" || message.type !== "TEXT";
  const client = role === "CLIENT";

  if (system) return <li className="flex justify-center"><div className="max-w-2xl rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-center text-xs text-[var(--color-muted)]"><span className="font-semibold">{formatLabel(message.type)}</span> · {message.body} · <time>{formatDate(message.createdAt)}</time></div></li>;

  return (
    <li className={`flex ${client ? "justify-start" : "justify-end"}`}>
      <article className={`max-w-[88%] rounded-[var(--radius-lg)] border px-4 py-3 sm:max-w-[72%] ${client ? "border-[var(--color-border)] bg-[var(--color-surface)]" : "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"><p className="text-xs font-semibold text-[var(--color-foreground)]">{message.sender?.displayName ?? formatLabel(role)}</p><time className="text-[0.7rem] text-[var(--color-muted)]">{formatDate(message.createdAt)}</time></div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-foreground)]">{message.body}</p>
      </article>
    </li>
  );
}

function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
