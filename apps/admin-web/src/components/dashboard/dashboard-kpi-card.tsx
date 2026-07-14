import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DashboardKpiCard({
  label,
  value,
  description,
  emptyDescription,
  href,
  linkLabel,
  icon,
  isLoading = false,
  error,
  loadingDescription = "Loading a current, organization-scoped summary.",
  errorDescription = "This summary could not be loaded. Open the workspace to review it directly.",
  unavailableLabel = "Unavailable",
}: {
  label: string;
  value?: number;
  description: string;
  emptyDescription: string;
  href: string;
  linkLabel: string;
  icon: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  loadingDescription?: string;
  errorDescription?: string;
  unavailableLabel?: string;
}) {
  const hasValue = typeof value === "number";
  const displayedDescription = error
    ? errorDescription
    : hasValue && value === 0
      ? emptyDescription
      : description;

  return (
    <article className="ui-card flex min-h-52 flex-col p-5" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-[var(--color-muted)]">{label}</p>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {icon}
        </span>
      </div>
      <div className="mt-5 flex-1">
        {isLoading ? (
          <div
            className="h-9 w-20 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]"
            role="status"
            aria-label={`Loading ${label}`}
          />
        ) : (
          <p
            className={`text-3xl font-semibold tracking-tight ${error ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]"}`}
          >
            {error ? unavailableLabel : (value ?? 0).toLocaleString()}
          </p>
        )}
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {isLoading ? loadingDescription : displayedDescription}
        </p>
      </div>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
      >
        {linkLabel}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}
