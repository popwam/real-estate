import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="ui-card p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-[var(--color-muted)]">{label}</p>
        {icon ? <div className="rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] p-2 text-[var(--color-accent)]">{icon}</div> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
    </div>
  );
}
