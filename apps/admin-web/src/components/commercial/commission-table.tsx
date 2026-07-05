"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, Building2, CalendarClock, HandCoins, Home } from "lucide-react";
import { CommissionStatusBadge } from "@/components/commercial/badges";
import { money } from "@/components/commercial/deal-table";
import { formatDate } from "@/lib/format";
import type { CommissionEntry } from "@/types/commercial";
import { useI18n } from "@/i18n";

export function CommissionTable({ commissions, basePath }: { commissions: CommissionEntry[]; basePath: string }) {
  const { t } = useI18n();

  if (!commissions.length) return <div className="ui-empty-state"><HandCoins className="h-8 w-8" aria-hidden="true" /><h3>{t("adminSweep.no.commission.entries.yet.a3152393")}</h3><p>{t("adminSweep.calculated.entries.from.eligible.finalized.deals.e0e2171a")}</p></div>;
  return <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{commissions.map((entry) => <article key={entry.id} className="ui-card flex min-w-0 flex-col p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{entry.partyType.toLowerCase()} commission</p><h3 className="mt-1 truncate text-lg font-semibold text-[var(--color-text)]">{money(entry.amount, entry.currency)}</h3></div><CommissionStatusBadge status={entry.status} /></div>
    <dl className="mt-5 grid gap-3 text-sm"><Fact icon={Building2} label="Recipient" value={recipientLabel(entry)} /><Fact icon={Home} label="Property" value={`${entry.project?.name ?? "Project"}${entry.unit?.unitNumber ? ` · Unit ${entry.unit.unitNumber}` : ""}`} /><Fact icon={BadgeDollarSign} label="Calculation" value={entry.commissionType ? `${entry.commissionType.toLowerCase()}${entry.commissionRule ? ` rule · ${entry.commissionRule.value}${entry.commissionType === "PERCENTAGE" ? "%" : ` ${entry.commissionRule.currency}`}` : ""}` : "Recorded commission amount"} /><Fact icon={CalendarClock} label="Updated" value={formatDate(entry.updatedAt)} /></dl>
    <div className="mt-auto pt-5"><Link className="ui-button ui-button-secondary" href={`${basePath}/${entry.id}`}>{t("adminSweep.review.calculation.d81e2a7d")}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
  </article>)}</div>;
}
function Fact({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-[var(--color-text-muted)]">{label}</dt><dd className="truncate font-medium text-[var(--color-text)]">{value}</dd></div></div>; }
export function recipientLabel(row: CommissionEntry) { if (row.recipientOrganization) return row.recipientOrganization.name; if (row.recipientUser) return [row.recipientUser.firstName, row.recipientUser.lastName].filter(Boolean).join(" ") || row.recipientUser.email; return row.partyType.toLowerCase(); }
