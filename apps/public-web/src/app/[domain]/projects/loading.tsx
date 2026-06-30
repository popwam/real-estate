import { tServer } from "@/i18n/server";

export default function DomainProjectsLoading() {
  const t = (key: string) => tServer(undefined, key);

  return (
    <div className="bg-[var(--color-background)]">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="h-4 w-44 rounded-[var(--radius-full)] bg-[var(--color-surface-muted)]" />
          <div className="mt-4 h-10 max-w-xl rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
          <div className="mt-4 h-5 max-w-2xl rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="ui-card h-80 animate-pulse" aria-label={t("loading.project")} />
        <div className="ui-card h-80 animate-pulse" aria-label={t("loading.project")} />
        <div className="ui-card h-80 animate-pulse" aria-label={t("loading.project")} />
      </section>
    </div>
  );
}
