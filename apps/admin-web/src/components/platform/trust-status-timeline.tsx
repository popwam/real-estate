import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import { formatDate } from "@/lib/format";

type TimelineItem = {
  id: string;
  title: string;
  status?: string | null;
  date?: string | null;
  description?: string | null;
  tone?: "success" | "warning" | "danger" | "neutral";
};

const toneIcon = {
  success: CheckCircle2,
  warning: Clock3,
  danger: XCircle,
  neutral: Circle,
};

const toneClass = {
  success: "text-[var(--color-success)] bg-[var(--color-success-soft)]",
  warning: "text-[var(--color-warning)] bg-[var(--color-warning-soft)]",
  danger: "text-[var(--color-danger)] bg-[var(--color-danger-soft)]",
  neutral: "text-[var(--color-muted)] bg-[var(--color-surface-muted)]",
};

export function TrustStatusTimeline({
  items,
  emptyText = "No review history has been returned yet.",
}: {
  items: TimelineItem[];
  emptyText?: string;
}) {
  if (!items.length) {
    return (
      <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
        {emptyText}
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const tone = item.tone ?? "neutral";
        const Icon = toneIcon[tone];

        return (
          <li
            key={item.id}
            className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[auto_1fr]"
          >
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneClass[tone]}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[var(--color-foreground)]">{item.title}</p>
                {item.status ? (
                  <span className="ui-badge text-[0.7rem]">{item.status.replaceAll("_", " ")}</span>
                ) : null}
              </div>
              {item.date ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDate(item.date)}</p>
              ) : null}
              {item.description ? (
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function trustToneFromStatus(status?: string | null): TimelineItem["tone"] {
  if (!status) return "neutral";
  if (["APPROVED", "VERIFIED", "ACCEPTED"].includes(status)) return "success";
  if (["PENDING_REVIEW", "UNDER_REVIEW", "PENDING"].includes(status)) return "warning";
  if (["REJECTED", "FAILED", "REVOKED", "SUSPENDED", "EXPIRED"].includes(status)) return "danger";
  return "neutral";
}
