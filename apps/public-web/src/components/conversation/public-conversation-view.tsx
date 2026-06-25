"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { PublicConversationComposer } from "@/components/conversation/public-conversation-composer";
import { PublicConversationShell } from "@/components/conversation/public-conversation-shell";
import { PublicMessageBubble } from "@/components/conversation/public-message-bubble";
import {
  getPublicConversationByToken,
  isPublicConversationMessageRateLimitError,
  postPublicConversationMessageByToken,
} from "@/lib/public-data";
import { PublicApiError, type PublicConversationByToken } from "@/lib/public-api";

type PublicConversationViewProps = {
  token: string;
  initialConversation: PublicConversationByToken;
};

export function PublicConversationView({
  token,
  initialConversation,
}: PublicConversationViewProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const [senderName, setSenderName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isOpen = conversation.status?.toUpperCase() === "OPEN";

  const sortedMessages = useMemo(
    () =>
      [...conversation.messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [conversation.messages],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();
    const trimmedSenderName = senderName.trim();

    setError(null);
    setSentMessage(null);

    if (!trimmedBody) {
      setError("Please enter a message before sending.");
      return;
    }

    if (trimmedBody.length > 2000) {
      setError("Message is too long. Please keep it under 2000 characters.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await postPublicConversationMessageByToken(token, {
          body: trimmedBody,
          senderName: trimmedSenderName || undefined,
        });

        setBody("");
        setSentMessage("Your message was sent.");

        try {
          const refreshed = await getPublicConversationByToken(token);
          setConversation(refreshed);
        } catch {
          setConversation((current) => ({
            ...current,
            messages: [...current.messages, response.message],
          }));
        }
      } catch (caught) {
        setError(errorMessage(caught));
      }
    });
  }

  return (
    <PublicConversationShell
      title={conversation.project?.name ?? "Private conversation"}
      description="This private link shows public-safe conversation details only. Do not share sensitive payment or identity documents here."
      context={
        <ConversationContext
          conversation={conversation}
          messageCount={sortedMessages.length}
        />
      }
      composer={
        <PublicConversationComposer
          senderName={senderName}
          body={body}
          error={error}
          sentMessage={sentMessage}
          isPending={isPending}
          disabled={!isOpen}
          onSenderNameChange={setSenderName}
          onBodyChange={setBody}
          onSubmit={onSubmit}
        />
      }
    >
      <section aria-labelledby="conversation-messages-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="conversation-messages-title"
              className="text-xl font-semibold text-[var(--color-foreground)]"
            >
              Messages
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              Replies are added to this conversation using the existing secure
              link.
            </p>
          </div>
          <span className="ui-badge">{readableStatus(conversation.status)}</span>
        </div>

        {sortedMessages.length ? (
          <div className="mt-5 grid gap-4">
            {sortedMessages.map((message) => (
              <PublicMessageBubble key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="ui-card mt-5 border-dashed p-6 text-center">
            <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
              This conversation is ready.
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              Messages from you and the project team will appear here when they
              are available.
            </p>
            <Link href="#conversation-composer" className="ui-button ui-button-primary mt-5">
              Start with a reply
            </Link>
          </div>
        )}
      </section>
    </PublicConversationShell>
  );
}

function ConversationContext({
  conversation,
  messageCount,
}: {
  conversation: PublicConversationByToken;
  messageCount: number;
}) {
  const participants = conversation.participants.filter(
    (participant) => participant.displayName || participant.publicRole,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {conversation.project?.name ? (
        <ContextCard label="Project" value={conversation.project.name} />
      ) : null}
      <ContextCard label="Status" value={readableStatus(conversation.status)} />
      <ContextCard
        label="Messages"
        value={`${messageCount} message${messageCount === 1 ? "" : "s"}`}
      />
      {participants.length ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Participants
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {participants.map((participant, index) => (
              <span
                key={`${participant.publicRole}-${participant.displayName}-${index}`}
                className="ui-badge"
              >
                {participant.displayName?.trim() || readableStatus(participant.publicRole)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
        {value}
      </p>
    </div>
  );
}

function readableStatus(value: string | null | undefined) {
  if (!value) return "Available";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function errorMessage(error: unknown) {
  if (isPublicConversationMessageRateLimitError(error)) {
    return "Too many messages were sent from this browser. Please try again shortly.";
  }

  if (error instanceof PublicApiError) {
    if (error.status === 400) {
      return error.message.toLowerCase().includes("2000")
        ? "Message is too long. Please keep it under 2000 characters."
        : "Please check your message and try again.";
    }
    if (error.status === 404) {
      return "This conversation link is no longer available.";
    }
    if (error.status === 410) {
      return "This conversation link has expired.";
    }
  }

  return "Could not send your message. Please try again.";
}
