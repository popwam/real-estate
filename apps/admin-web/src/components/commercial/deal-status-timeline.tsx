import { Check, Circle } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Deal } from "@/types/commercial";

export function DealStatusTimeline({ deal }: { deal: Deal }) {
  const steps = [{ label: "Deal created", date: deal.createdAt, complete: true }];
  if (deal.approvedAt) steps.push({ label: "Deal approved", date: deal.approvedAt, complete: true });
  if (deal.soldAt) steps.push({ label: "Sale confirmed", date: deal.soldAt, complete: true });
  if (deal.cancelledAt) steps.push({ label: "Deal cancelled", date: deal.cancelledAt, complete: true });
  if (steps.length === 1) steps.push({ label: deal.status.replaceAll("_", " ").toLowerCase(), date: deal.updatedAt, complete: false });
  return <ol className="space-y-4" aria-label="Deal progress">{steps.map((step) => { const Icon = step.complete ? Check : Circle; return <li key={`${step.label}-${step.date}`} className="flex gap-3"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${step.complete ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="font-medium capitalize text-[var(--color-text)]">{step.label}</p><p className="text-sm text-[var(--color-text-muted)]">{formatDate(step.date)}</p></div></li>; })}</ol>;
}
