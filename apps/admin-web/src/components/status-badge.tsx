import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  APPROVED: "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  ACTIVE: "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  PENDING_REVIEW: "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  UNDER_REVIEW: "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  DRAFT: "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
  SUSPENDED: "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  REVOKED: "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  REJECTED: "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusClasses[status] ?? "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-foreground)]",
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
