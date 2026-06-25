import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DashboardActionCard({
  title,
  description,
  href,
  actionLabel,
  icon,
  emphasis = false,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-[var(--radius-lg)] border p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${
        emphasis
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-accent)]">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
      >
        {actionLabel}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}
