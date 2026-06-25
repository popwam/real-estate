"use client";

import type { FormEvent } from "react";

type PublicConversationComposerProps = {
  senderName: string;
  body: string;
  error: string | null;
  sentMessage: string | null;
  isPending: boolean;
  disabled?: boolean;
  onSenderNameChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PublicConversationComposer({
  senderName,
  body,
  error,
  sentMessage,
  isPending,
  disabled = false,
  onSenderNameChange,
  onBodyChange,
  onSubmit,
}: PublicConversationComposerProps) {
  const errorId = "public-conversation-compose-error";
  const successId = "public-conversation-compose-success";

  if (disabled) {
    return (
      <div className="sticky bottom-0 shrink-0 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_96%,transparent)] p-4 backdrop-blur">
        <p className="ui-feedback text-[var(--color-muted)]">
          This conversation is closed, so new replies cannot be sent from this link.
        </p>
      </div>
    );
  }

  return (
    <form
      id="conversation-composer"
      className="sticky bottom-0 grid shrink-0 gap-4 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-raised)_96%,transparent)] p-4 backdrop-blur"
      onSubmit={onSubmit}
      aria-describedby={[error ? errorId : null, sentMessage ? successId : null]
        .filter(Boolean)
        .join(" ") || undefined}
    >
      <div className="grid gap-4 sm:grid-cols-[0.36fr_0.64fr]">
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          Your name <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          <input
            value={senderName}
            onChange={(event) => onSenderNameChange(event.target.value)}
            maxLength={120}
            className="ui-input"
            autoComplete="name"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          Message
          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            rows={3}
            maxLength={2000}
            className="ui-input"
            required
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[var(--color-muted)]">
          {body.trim().length}/2000 characters
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="ui-button ui-button-primary"
        >
          {isPending ? "Sending..." : "Send message"}
        </button>
      </div>

      {error ? (
        <p id={errorId} className="ui-feedback ui-feedback-error" role="alert">
          {error}
        </p>
      ) : null}
      {sentMessage ? (
        <p id={successId} className="ui-feedback ui-feedback-success" role="status">
          {sentMessage}
        </p>
      ) : null}
    </form>
  );
}
