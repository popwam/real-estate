"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, Mail, MapPin, Phone, UserRoundCheck } from "lucide-react";
import { ClaimLeadButton } from "@/components/admin-crm/claim-lead-button";
import { CrmLeadStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { EmptyState } from "@/components/empty-state";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import type { CrmLead } from "@/types/admin-crm";

export function LeadResponsiveList({ leads, basePath, marketplace, isClaiming, claimError, onClaim }: { leads: CrmLead[]; basePath: string; marketplace?: boolean; isClaiming?: boolean; claimError?: Error | null; onClaim?: (id: string) => Promise<unknown> }) {
  const { t } = useI18n();

  if (!leads.length) return <EmptyState title={marketplace ? t("leadList.emptyMarketplace") : t("leadList.emptyCrm")} description={marketplace ? t("leadList.emptyMarketplaceDescription") : t("leadList.emptyCrmDescription")} />;

  return (
    <>
      <div className="grid gap-3 xl:hidden">
        {leads.map((lead) => <LeadCard key={lead.id} lead={lead} basePath={basePath} marketplace={marketplace} isClaiming={isClaiming} claimError={claimError} onClaim={onClaim} />)}
      </div>
      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] xl:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-muted)]"><tr><Header>{t("leadList.lead")}</Header><Header>{t("leadList.interest")}</Header><Header>{t("leadList.stageStatus")}</Header><Header>{t("leadList.owner")}</Header><Header>{t("leadList.source")}</Header><Header>{t("common.updated")}</Header><Header><span className="sr-only">{t("inventoryList.actions")}</span></Header></tr></thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-[var(--color-surface-muted)]">
                <Cell><p className="font-semibold text-[var(--color-foreground)]">{lead.client?.name ?? t("leadList.unnamed")}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{contactSummary(lead, t)}</p><div className="mt-2"><PreferredContactMethodBadge method={lead.preferredContactMethod} /></div></Cell>
                <Cell><p className="font-medium text-[var(--color-foreground)]">{lead.project?.name ?? t("leadList.noProjectLinked")}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{lead.unitId ? t("leadList.specificUnitLinked") : t("leadList.projectLevelInterest")}</p></Cell>
                <Cell><div className="flex flex-col items-start gap-2"><CrmLeadStatusBadge status={lead.status} /><span className="text-xs text-[var(--color-muted)]">{lead.pipelineStage?.name ?? t("leadList.noPipelineStage")}</span></div></Cell>
                <Cell>{ownerLabel(lead, t)}</Cell>
                <Cell><p>{lead.client?.source ?? t("common.notSet")}</p><p className="mt-1 max-w-48 truncate text-xs" title={lead.sourcePage ?? undefined}>{lead.sourcePage ?? t("leadList.noSourcePage")}</p></Cell>
                <Cell><time>{formatDate(lead.updatedAt)}</time></Cell>
                <Cell><LeadActions lead={lead} basePath={basePath} marketplace={marketplace} isClaiming={isClaiming} claimError={claimError} onClaim={onClaim} /></Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LeadCard({ lead, basePath, marketplace, isClaiming, claimError, onClaim }: { lead: CrmLead; basePath: string; marketplace?: boolean; isClaiming?: boolean; claimError?: Error | null; onClaim?: (id: string) => Promise<unknown> }) {
  const { t } = useI18n();

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold text-[var(--color-foreground)]">{lead.client?.name ?? t("leadList.unnamed")}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{t("leadList.updatedAt", { date: formatDate(lead.updatedAt) })}</p></div><CrmLeadStatusBadge status={lead.status} /></div>
      <div className="mt-4 flex flex-wrap gap-2"><PreferredContactMethodBadge method={lead.preferredContactMethod} />{lead.pipelineStage?.name ? <span className="ui-badge">{lead.pipelineStage.name}</span> : null}</div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Fact icon={<Building2 className="h-4 w-4" aria-hidden="true" />} label={t("common.project")} value={lead.project?.name ?? t("leadList.notLinked")} />
        <Fact icon={<UserRoundCheck className="h-4 w-4" aria-hidden="true" />} label={t("leadList.owner")} value={ownerLabel(lead, t)} />
        <Fact icon={<MapPin className="h-4 w-4" aria-hidden="true" />} label={t("leadList.source")} value={lead.client?.source ?? lead.sourcePage ?? t("common.notSet")} />
        <Fact icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label={t("common.created")} value={formatDate(lead.createdAt)} />
        <Fact icon={<Phone className="h-4 w-4" aria-hidden="true" />} label={t("publicLeadDetail.phone")} value={lead.client?.phoneLast4 ? t("leadList.ending", { value: lead.client.phoneLast4 }) : lead.client?.phone ?? t("leadList.masked")} />
        <Fact icon={<Mail className="h-4 w-4" aria-hidden="true" />} label={t("publicLeadDetail.email")} value={lead.client?.email ?? t("common.notSet")} />
      </dl>
      <div className="mt-4 border-t border-[var(--color-border)] pt-4"><LeadActions lead={lead} basePath={basePath} marketplace={marketplace} isClaiming={isClaiming} claimError={claimError} onClaim={onClaim} /></div>
    </article>
  );
}

function LeadActions({ lead, basePath, marketplace, isClaiming, claimError, onClaim }: { lead: CrmLead; basePath: string; marketplace?: boolean; isClaiming?: boolean; claimError?: Error | null; onClaim?: (id: string) => Promise<unknown> }) {
  const { t } = useI18n();

  return <div className="flex flex-wrap items-start gap-2">{!lead.unavailable ? <Link href={`${basePath}/${lead.id}`} className="ui-button ui-button-secondary">{t("leadList.viewLead")}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link> : <span className="ui-badge">{t("leadList.alreadyClaimed")}</span>}{marketplace && onClaim && !lead.unavailable && !lead.claimedByBrokerUserId ? <ClaimLeadButton error={claimError} isPending={isClaiming} leadId={lead.id} onClaim={onClaim} /> : null}</div>;
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"><dt className="flex items-center gap-2 text-xs text-[var(--color-muted)]">{icon}{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--color-foreground)]" title={value}>{value}</dd></div>;
}

function Header({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-start font-semibold">{children}</th>; }
function Cell({ children }: { children: React.ReactNode }) { return <td className="px-4 py-4 align-top text-[var(--color-muted)]">{children}</td>; }
function contactSummary(lead: CrmLead, t: (key: string, params?: Record<string, string | number>) => string) { return lead.client?.email ?? (lead.client?.phoneLast4 ? t("leadList.phoneEnding", { value: lead.client.phoneLast4 }) : lead.client?.phone ?? t("leadList.contactMasked")); }
function ownerLabel(lead: CrmLead, t: (key: string, params?: Record<string, string | number>) => string) { return lead.claimedByOrganization?.name ?? brokerName(lead) ?? (lead.claimedByOrganizationId || lead.claimedByBrokerUserId || lead.unavailable ? t("leadList.claimed") : t("leadList.unclaimed")); }
function brokerName(lead: CrmLead) { const name = [lead.claimedByBroker?.firstName, lead.claimedByBroker?.lastName].filter(Boolean).join(" "); return name || null; }
