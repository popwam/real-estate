import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DashboardWelcome({
  eyebrow,
  title,
  description,
  context,
  primaryAction,
  secondaryAction,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  context?: string;
  primaryAction: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  icon: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-primary)] p-6 text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)] sm:p-8">
      <div
        className="pointer-events-none absolute inset-y-0 end-0 w-1/2 opacity-20 [background:radial-gradient(circle_at_center,var(--color-accent)_0,transparent_68%)]"
        aria-hidden="true"
      />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-primary-foreground)_12%,transparent)]">
              {icon}
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
              {eyebrow}
            </p>
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 opacity-80 sm:text-base">
            {description}
          </p>
          {context ? (
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] opacity-65">
              {context}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="ui-button border border-[color-mix(in_srgb,var(--color-primary-foreground)_25%,transparent)] bg-transparent text-[var(--color-primary-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary-foreground)_10%,transparent)]"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
          <Link
            href={primaryAction.href}
            className="ui-button bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:bg-[var(--color-accent-hover)]"
          >
            {primaryAction.label}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
