"use client";

import { Check, Circle } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ReservationRequest } from "@/types/lead-reservations";
import { useI18n } from "@/i18n";

export function ReservationStatusTimeline({ request }: { request: ReservationRequest }) {
  const { t } = useI18n();

  const outcome = request.status === "APPROVED" ? { label: "Approved and unit held", date: request.approvedAt } : request.status === "REJECTED" ? { label: "Rejected", date: request.rejectedAt } : request.status === "CANCELLED" ? { label: "Cancelled", date: request.cancelledAt } : null;
  return <ol className="space-y-4" aria-label={t("adminSweep.reservation.progress.6a22a281")}>
    <Step label="Request submitted" date={request.createdAt} complete />
    {outcome ? <Step label={outcome.label} date={outcome.date ?? request.updatedAt} complete /> : <Step label="Developer decision pending" date="The unit is not confirmed as held until approval." />}
  </ol>;
}

function Step({ label, date, complete = false }: { label: string; date?: string | null; complete?: boolean }) {
  const Icon = complete ? Check : Circle;
  return <li className="flex gap-3"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${complete ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="font-medium text-[var(--color-text)]">{label}</p><p className="text-sm text-[var(--color-text-muted)]">{date?.includes("T") ? formatDate(date) : date}</p></div></li>;
}
