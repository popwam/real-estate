import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert } from "lucide-react";

export function ProjectReadinessCard({
  title,
  value,
  description,
  href,
  actionLabel,
  ready,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  href?: string;
  actionLabel?: string;
  ready?: boolean;
  icon: ReactNode;
}) {
  const StateIcon = ready === false ? CircleAlert : CheckCircle2;

  return (
    <article className="ui-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {icon}
        </span>
        {typeof ready === "boolean" ? (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${ready ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
            <StateIcon className="h-4 w-4" aria-hidden="true" />
            {ready ? "Ready" : "Needs attention"}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{title}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">{value}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      {href && actionLabel ? (
        <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">
          {actionLabel}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}
