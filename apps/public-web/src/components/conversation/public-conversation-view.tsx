"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
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
  const isOpen = conversation.status === "OPEN";

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
        setSentMessage("Message sent.");

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
    <div className="rounded border border-slate-200 bg-white p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
        Public conversation
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        {conversation.project?.name ?? "POPWAM chat request"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This view is limited to public-safe conversation fields. Replies are
        sent through this private conversation link.
      </p>

      <dl className="mt-6 grid gap-4 border-y border-slate-200 py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-950">Status</dt>
          <dd className="mt-1 text-slate-700">{conversation.status}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-950">Type</dt>
          <dd className="mt-1 text-slate-700">{conversation.type}</dd>
        </div>
      </dl>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-950">Participants</h2>
        <div className="mt-3 grid gap-2">
          {conversation.participants.map((participant, index) => (
            <div
              key={`${participant.publicRole}-${participant.displayName}-${index}`}
              className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"
            >
              <p className="font-semibold text-slate-950">
                {participant.displayName ?? participant.publicRole}
              </p>
              <p className="mt-1 text-slate-600">{participant.publicRole}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-950">Messages</h2>
        <div className="mt-3 grid gap-3">
          {sortedMessages.length ? (
            sortedMessages.map((message) => (
              <article
                key={message.id}
                className="rounded border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {message.sender?.displayName ??
                      message.sender?.publicRole ??
                      message.type}
                  </span>
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString("en-US")}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {message.body}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No public-safe messages have been returned yet.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-950">Reply</h2>
        {isOpen ? (
          <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Your name <span className="font-normal text-slate-500">(optional)</span>
              <input
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
                maxLength={120}
                className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-emerald-600 focus:ring-2"
                placeholder="Buyer Name"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Message
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                maxLength={2000}
                className="resize-y rounded border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-emerald-600 focus:ring-2"
                placeholder="Write a plain-text reply..."
                required
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending ? "Sending..." : "Send reply"}
              </button>
              <span className="text-xs text-slate-500">
                {body.trim().length}/2000
              </span>
            </div>
            {error ? (
              <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {sentMessage ? (
              <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {sentMessage}
              </p>
            ) : null}
          </form>
        ) : (
          <p className="mt-3 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            This conversation is closed.
          </p>
        )}
      </section>
    </div>
  );
}

function errorMessage(error: unknown) {
  if (isPublicConversationMessageRateLimitError(error)) {
    return "Too many messages. Please try again shortly.";
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
  }

  return "Could not send your message. Please try again.";
}
