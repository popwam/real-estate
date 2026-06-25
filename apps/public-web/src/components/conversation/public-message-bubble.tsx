import type { PublicConversationByToken } from "@/lib/public-api";

type PublicMessageBubbleProps = {
  message: PublicConversationByToken["messages"][number];
};

export function PublicMessageBubble({ message }: PublicMessageBubbleProps) {
  const role = message.sender?.publicRole ?? "";
  const isClient = role.toUpperCase() === "CLIENT";
  const senderLabel =
    message.sender?.displayName?.trim() ||
    readableRole(message.sender?.publicRole) ||
    readableRole(message.type) ||
    "Message";

  return (
    <article className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[min(100%,42rem)] rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)]",
          isClient
            ? "border-[color-mix(in_srgb,var(--color-accent)_34%,var(--color-border))] bg-[var(--color-accent-soft)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-foreground)]">
            {senderLabel}
          </span>
          {message.createdAt ? (
            <time dateTime={message.createdAt}>{formatTimestamp(message.createdAt)}</time>
          ) : null}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-foreground)]">
          {message.body}
        </p>
      </div>
    </article>
  );
}

function readableRole(value: string | null | undefined) {
  if (!value) return "";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
