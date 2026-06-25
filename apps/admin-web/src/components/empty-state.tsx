import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-10 text-center">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
