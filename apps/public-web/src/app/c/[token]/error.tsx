"use client";

import { useI18n } from "@/i18n";

export default function PublicConversationError({ reset }: { reset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6">
      <div className="ui-card mx-auto max-w-2xl p-6 text-center sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {t("conversation.title")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          {t("conversation.errorLoadTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          {t("conversation.errorLoadDescription")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="ui-button ui-button-primary mt-6"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    </div>
  );
}
