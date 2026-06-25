import type { CrmActivityType } from "@/types/admin-crm";

export function CrmActivityTypeBadge({ type }: { type: CrmActivityType }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone(type)}`}>{formatLabel(type)}</span>;
}

function tone(type: CrmActivityType) {
  if (["LEAD_CONVERTED", "TASK_COMPLETED"].includes(type)) return "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]";
  if (["LEAD_CLAIMED", "LEAD_STAGE_CHANGED", "TASK_CREATED"].includes(type)) return "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]";
  return "border-[var(--color-info)] bg-[var(--color-info-soft)] text-[var(--color-info)]";
}

function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
