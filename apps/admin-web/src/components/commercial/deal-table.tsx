"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, Building2, CalendarClock, Handshake, Home } from "lucide-react";
import { DealStatusBadge } from "@/components/commercial/badges";
import { formatDate } from "@/lib/format";
import type { Deal } from "@/types/commercial";
import { useI18n } from "@/i18n";

export function DealTable({ deals, basePath }: { deals: Deal[]; basePath: string }) {
  const { t } = useI18n();

  if (!deals.length) return <div className="ui-empty-state"><Handshake className="h-8 w-8" aria-hidden="true" /><h3>{t("adminSweep.no.deals.yet.3ea5c55c")}</h3><p>{t("adminSweep.deals.created.from.eligible.negotiation.rooms.wi.6e94d8bc")}</p></div>;
  return <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{deals.map((deal) => <article key={deal.id} className="ui-card flex min-w-0 flex-col p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{t("adminSweep.commercial.outcome.570dcd6b")}</p><h3 className="mt-1 truncate text-base font-semibold text-[var(--color-text)]">{deal.project?.name ?? "Property deal"}</h3></div><DealStatusBadge status={deal.status} /></div>
    <dl className="mt-5 grid gap-3 text-sm">
      <Fact icon={Home} label="Unit" value={deal.unit?.unitNumber ?? "Unit details unavailable"} />
      <Fact icon={BadgeDollarSign} label="Final price" value={money(deal.finalPrice, deal.currency)} />
      <Fact icon={Building2} label="Parties" value={`${deal.developer?.name ?? "Developer"} · ${deal.brokerage?.name ?? "Individual broker"}`} />
      <Fact icon={CalendarClock} label="Updated" value={formatDate(deal.updatedAt)} />
    </dl>
    <div className="mt-auto pt-5"><Link className="ui-button ui-button-secondary" href={`${basePath}/${deal.id}`}>{t("adminSweep.review.deal.4b268c81")}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
  </article>)}</div>;
}
function Fact({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-[var(--color-text-muted)]">{label}</dt><dd className="truncate font-medium text-[var(--color-text)]">{value}</dd></div></div>; }
export function brokerName(deal: Deal) { if (!deal.broker) return "Assigned broker"; return [deal.broker.firstName, deal.broker.lastName].filter(Boolean).join(" ") || deal.broker.email; }
export function money(value?: string | number | null, currency = "EGP") { if (value === undefined || value === null || value === "") return "Not recorded"; const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount) : `${value} ${currency}`; }
