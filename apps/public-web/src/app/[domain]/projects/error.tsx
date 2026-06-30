"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

export default function DomainProjectsError({ reset }: { reset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="bg-[var(--color-background)] px-4 py-16 sm:px-6">
      <section className="ui-card mx-auto max-w-2xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {t("domainProjects.error.eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-foreground)]">
          {t("domainProjects.error.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          {t("domainProjects.error.description")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="ui-button ui-button-primary">
            {t("common.tryAgain")}
          </button>
          <Link href="/" className="ui-button ui-button-secondary">
            {t("nav.popwamHome")}
          </Link>
        </div>
      </section>
    </div>
  );
}
