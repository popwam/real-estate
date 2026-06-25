import type { ReactNode } from "react";

export function DetailCard({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="ui-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value?: ReactNode }>;
}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm text-[var(--color-foreground)]">{item.value || "Not set"}</dd>
        </div>
      ))}
    </dl>
  );
}
