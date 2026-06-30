"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { PublicConversationComposer } from "@/components/conversation/public-conversation-composer";
import { PublicConversationShell } from "@/components/conversation/public-conversation-shell";
import { PublicMessageBubble } from "@/components/conversation/public-message-bubble";
import { useI18n } from "@/i18n";
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
  const { t, formatNumber } = useI18n();

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
      setError(t("conversation.error.required"));
      return;
    }

    if (trimmedBody.length > 2000) {
      setError(t("conversation.error.tooLong"));
      return;
    }

    startTransition(async () => {
      try {
        const response = await postPublicConversationMessageByToken(token, {
          body: trimmedBody,
          senderName: trimmedSenderName || undefined,
        });

        setBody("");
        setSentMessage(t("conversation.sent"));

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
        setError(errorMessage(caught, t));
      }
    });
  }

  return (
    <PublicConversationShell
      title={conversation.project?.name ?? t("conversation.title")}
      description={t("conversation.description")}
      context={
        <ConversationContext
          conversation={conversation}
          messageCountLabel={t("conversation.messageCount", {
            count: formatNumber(sortedMessages.length),
          })}
          statusLabel={readableStatus(conversation.status, t)}
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
              {t("conversation.messages")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              {t("conversation.repliesDescription")}
            </p>
          </div>
          <span className="ui-badge">{readableStatus(conversation.status, t)}</span>
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
              {t("conversation.ready")}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              {t("conversation.emptyMessages")}
            </p>
            <Link href="#conversation-composer" className="ui-button ui-button-primary mt-5">
              {t("conversation.startReply")}
            </Link>
          </div>
        )}
      </section>
    </PublicConversationShell>
  );
}

function ConversationContext({
  conversation,
  messageCountLabel,
  statusLabel,
}: {
  conversation: PublicConversationByToken;
  messageCountLabel: string;
  statusLabel: string;
}) {
  const { t } = useI18n();
  const participants = conversation.participants.filter(
    (participant) => participant.displayName || participant.publicRole,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {conversation.project?.name ? (
        <ContextCard label={t("conversation.project")} value={conversation.project.name} />
      ) : null}
      <ContextCard label={t("conversation.status")} value={statusLabel} />
      <ContextCard
        label={t("conversation.messages")}
        value={messageCountLabel}
      />
      {participants.length ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {t("conversation.participants")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {participants.map((participant, index) => (
              <span
                key={`${participant.publicRole}-${participant.displayName}-${index}`}
                className="ui-badge"
              >
                {participant.displayName?.trim() || readableStatus(participant.publicRole, t)}
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

function readableStatus(value: string | null | undefined, t: (key: string) => string) {
  if (!value) return t("status.available");

  const normalized = value.toUpperCase();
  if (normalized === "OPEN") return t("status.open");
  if (normalized === "CLOSED") return t("status.closed");
  if (normalized === "ARCHIVED") return t("status.archived");
  return value;
}

function errorMessage(error: unknown, t: (key: string) => string) {
  if (isPublicConversationMessageRateLimitError(error)) {
    return t("conversation.error.rateLimit");
  }

  if (error instanceof PublicApiError) {
    if (error.status === 400) {
      return error.message.toLowerCase().includes("2000")
        ? t("conversation.error.tooLong")
        : t("conversation.error.validation");
    }
    if (error.status === 404) {
      return t("conversation.error.notFound");
    }
    if (error.status === 410) {
      return t("conversation.error.expired");
    }
  }

  return t("conversation.error.generic");
}
