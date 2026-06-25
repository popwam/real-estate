import { StatusBadge } from "@/components/status-badge";
import type { ConversationStatus, CrmLeadStatus, PreferredContactMethod } from "@/types/admin-crm";

export function CrmLeadStatusBadge({ status }: { status: CrmLeadStatus }) {
  return <StatusBadge status={status} className={tone(status)} />;
}

export function PreferredContactMethodBadge({ method }: { method?: PreferredContactMethod | null }) {
  return <StatusBadge status={method ?? "NOT_SET"} className="border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-foreground)]" />;
}

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  return <StatusBadge status={status} className={tone(status)} />;
}

function tone(status: string) {
  if (["QUALIFIED", "CONVERTED", "OPEN"].includes(status)) return "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]";
  if (["CLAIMED", "IN_CONVERSATION", "ARCHIVED"].includes(status)) return "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]";
  if (["LOST", "SPAM"].includes(status)) return "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]";
  return "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-foreground)]";
}
