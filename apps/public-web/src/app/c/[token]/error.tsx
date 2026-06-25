"use client";

export default function PublicConversationError({ reset }: { reset: () => void }) {
  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      <div className="ui-card mx-auto max-w-2xl p-6 text-center sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          Private conversation
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          We could not load this conversation.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Please try again. If the issue continues, the conversation may be
          temporarily unavailable.
        </p>
        <button
          type="button"
          onClick={reset}
          className="ui-button ui-button-primary mt-6"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
