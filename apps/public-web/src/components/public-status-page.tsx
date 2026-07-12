"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

type StatusKind = "403" | "404" | "500" | "505";

export function PublicStatusPage({ kind, reset }: { kind: StatusKind; reset?: () => void }) {
  const { t } = useI18n();
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,var(--color-accent-soft),transparent_36%),var(--color-background)] px-4 py-10 text-[var(--color-foreground)]">
      <section className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-lg)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-accent-soft)] text-xl font-black text-[var(--color-accent)]">
          {kind}
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-[var(--color-accent)]">{t(`statusPage.${kind}.eyebrow`)}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t(`statusPage.${kind}.title`)}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--color-muted)]">{t(`statusPage.${kind}.body`)}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link className="ui-button ui-button-primary" href="/">
            {t("statusPage.home")}
          </Link>
          {reset ? (
            <button className="ui-button ui-button-secondary" type="button" onClick={reset}>
              {t("statusPage.tryAgain")}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
