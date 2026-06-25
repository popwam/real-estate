"use client";

import Link from "next/link";
import { Building2, CalendarDays, ExternalLink, Mail, MapPin, MessageSquarePlus, Phone, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { ClaimLeadButton } from "@/components/admin-crm/claim-lead-button";
import { CrmActivityTimeline } from "@/components/admin-crm/crm-activity-timeline";
import { CrmLeadOperationsSection } from "@/components/admin-crm/crm-lead-operations-section";
import { CrmLeadStatusUpdateDialog } from "@/components/admin-crm/crm-lead-status-update-dialog";
import { CrmLeadStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useClaimCrmLead, useCreateConversationFromCrmLead, useCrmLead, useCrmLeadActivities } from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";
import type { CrmActivityListQuery, CrmLead } from "@/types/admin-crm";

export function CrmLeadDetailView({ id, conversationsBasePath, showClaimAction = false }: { id: string; conversationsBasePath: string; showClaimAction?: boolean }) {
  const [activityQuery, setActivityQuery] = useState<CrmActivityListQuery>({ page: 1, pageSize: 20 });
  const { data: lead, isLoading, error } = useCrmLead(id);
  const activities = useCrmLeadActivities(id, activityQuery);
  const claim = useClaimCrmLead();
  const createConversation = useCreateConversationFromCrmLead();

  if (isLoading) return <LoadingState label="Loading CRM lead" />;
  if (error) return <FeedbackState tone="error" title="CRM lead could not be loaded" description={error.message} />;
  if (!lead) return <FeedbackState tone="error" title="CRM lead is unavailable" />;

  async function openConversation() {
    const conversation = await createConversation.mutateAsync({ crmLeadId: id });
    window.location.href = `${conversationsBasePath}/${conversation.id}`;
  }

  const leadName = lead.client?.name ?? "CRM lead";
  const owner = ownerLabel(lead);

  return (
    <div className="space-y-6">
      <PageHeader
        title={leadName}
        description="Sales command center for lead context, ownership, activity, follow-up, and conversation."
        actions={<div className="flex flex-wrap items-start gap-2">{showClaimAction && !lead.unavailable && !lead.claimedByBrokerUserId ? <ClaimLeadButton error={claim.error} isPending={claim.isPending} leadId={lead.id} onClaim={(leadId) => claim.mutateAsync(leadId)} /> : null}<button type="button" className="ui-button ui-button-primary" disabled={createConversation.isPending || Boolean(lead.unavailable)} onClick={openConversation}><MessageSquarePlus className="h-4 w-4" aria-hidden="true" />{createConversation.isPending ? "Opening…" : "Open conversation"}</button></div>}
      />

      {createConversation.error ? <FeedbackState tone="error" title="Conversation could not be opened" description={createConversation.error.message} /> : null}

      <section className="ui-card p-5" aria-labelledby="lead-overview-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">{lead.client?.source ?? "CRM lead"}</p><h2 id="lead-overview-title" className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">Lead overview</h2><p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Created {formatDate(lead.createdAt)} · Updated {formatDate(lead.updatedAt)}</p></div>
          <div className="flex flex-wrap gap-2"><CrmLeadStatusBadge status={lead.status} /><PreferredContactMethodBadge method={lead.preferredContactMethod} />{lead.pipelineStage?.name ? <span className="ui-badge">{lead.pipelineStage.name}</span> : null}</div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewFact icon={<Building2 className="h-4 w-4" aria-hidden="true" />} label="Project interest" value={lead.project?.name ?? "No project linked"} />
          <OverviewFact icon={<MapPin className="h-4 w-4" aria-hidden="true" />} label="Source page" value={lead.sourcePage ?? "Not available"} />
          <OverviewFact icon={<UserRoundCheck className="h-4 w-4" aria-hidden="true" />} label="Owner" value={owner} />
          <OverviewFact icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label="Claimed" value={lead.claimedAt ? formatDate(lead.claimedAt) : "Not claimed"} />
        </dl>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <DetailCard title="Project and attribution">
            <div className="grid gap-4 sm:grid-cols-2">
              <BusinessField label="Project" value={lead.project?.name ?? "No project linked"} />
              <BusinessField label="Project state" value={[lead.project?.status, lead.project?.visibility].filter((value): value is string => Boolean(value)).map(formatLabel).join(" · ") || "Not available"} />
              <BusinessField label="Unit interest" value={lead.unitId ? "A specific unit is linked" : "Project-level interest"} />
              <BusinessField label="Assignment" value={[lead.assignmentType, lead.assignmentReason].filter((value): value is string => Boolean(value)).map(formatLabel).join(" · ") || "No assignment reason supplied"} />
              <BusinessField label="Lead source" value={lead.client?.source ?? "Not available"} />
              <BusinessField label="Public lead state" value={lead.publicLead?.status ? formatLabel(lead.publicLead.status) : "Not linked"} />
            </div>
            <AttributionSummary utm={lead.utm} />
          </DetailCard>

          <DetailCard title="Visitor behavior">
            <VisitorBehavior lead={lead} />
          </DetailCard>

          <DetailCard title="Pipeline, notes, and follow-up">
            <CrmLeadOperationsSection leadId={lead.id} currentStageId={lead.pipelineStageId} />
          </DetailCard>

          <DetailCard title="Activity timeline">
            <CrmActivityTimeline activities={activities.data?.items} error={activities.error} isLoading={activities.isLoading} pagination={activities.data?.pagination} onPageChange={(page) => setActivityQuery((current) => ({ ...current, page }))} onPageSizeChange={(pageSize) => setActivityQuery((current) => ({ ...current, page: 1, pageSize }))} />
          </DetailCard>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[calc(var(--topbar-height)+1.5rem)]" aria-label="Lead actions and contact">
          <DetailCard title="Contact">
            <div className="space-y-3">
              <ContactRow icon={<Phone className="h-4 w-4" aria-hidden="true" />} label="Phone" value={lead.client?.phoneLast4 ? `${lead.client.phone ?? "Phone"} · ending ${lead.client.phoneLast4}` : lead.client?.phone ?? "Masked"} />
              <ContactRow icon={<Mail className="h-4 w-4" aria-hidden="true" />} label="Email" value={lead.client?.email ?? "Not available"} />
              <ContactRow icon={<UserRoundCheck className="h-4 w-4" aria-hidden="true" />} label="Preferred contact" value={formatLabel(lead.preferredContactMethod ?? "NOT_SET")} />
            </div>
          </DetailCard>

          <DetailCard title="Next action">
            <p className="text-sm leading-6 text-[var(--color-muted)]">Continue the conversation before moving to reservation or deal workflows.</p>
            <button type="button" className="ui-button ui-button-primary mt-4 w-full" disabled={createConversation.isPending || Boolean(lead.unavailable)} onClick={openConversation}><MessageSquarePlus className="h-4 w-4" aria-hidden="true" />{createConversation.isPending ? "Opening…" : "Create or open conversation"}</button>
            <Link href={conversationsBasePath} className="ui-button ui-button-secondary mt-2 w-full">Conversation inbox<ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
          </DetailCard>

          <DetailCard title="Lead status"><CrmLeadStatusUpdateDialog leadId={lead.id} currentStatus={lead.status} /></DetailCard>
          <DetailCard title="Ownership"><BusinessField label="Claimed broker" value={lead.claimedByBroker ? brokerName(lead.claimedByBroker) : lead.claimedByBrokerUserId ? "Assigned broker" : "Unclaimed"} /><div className="mt-3"><BusinessField label="Claimed organization" value={lead.claimedByOrganization?.name ?? (lead.claimedByOrganizationId ? "Assigned organization" : "Unclaimed")} /></div></DetailCard>
        </aside>
      </div>
    </div>
  );
}

function VisitorBehavior({ lead }: { lead: CrmLead }) {
  const behavior = lead.visitorBehavior;
  if (!behavior) return <EmptyState title="No visitor journey is attached" description="Use the lead source, project interest, notes, and conversation history currently available." />;
  return <div className="space-y-5"><dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><BusinessField label="First seen" value={formatDate(behavior.firstSeenAt)} /><BusinessField label="Last seen" value={formatDate(behavior.lastSeenAt)} /><BusinessField label="Time on page" value={`${Math.round(behavior.totalTimeOnPageMs / 1000)} seconds`} /><BusinessField label="Maximum scroll" value={`${behavior.maxScrollDepth}%`} /><BusinessField label="Recorded events" value={behavior.eventCount.toLocaleString()} /><BusinessField label="Viewed projects" value={behavior.viewedProjects.map((project) => project.name).join(", ") || "None recorded"} /><BusinessField label="Search terms" value={behavior.searchTerms.join(", ") || "None recorded"} /><BusinessField label="Sections reached" value={behavior.sectionsReached.map(formatLabel).join(", ") || "None recorded"} /></dl>{behavior.viewedPaths.length ? <div><h3 className="text-sm font-semibold text-[var(--color-foreground)]">Pages viewed</h3><ul className="mt-2 grid gap-2 sm:grid-cols-2">{behavior.viewedPaths.slice(0, 8).map((path) => <li key={path} className="truncate rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-muted)]" title={path}>{path}</li>)}</ul></div> : null}</div>;
}

function AttributionSummary({ utm }: { utm?: Record<string, unknown> | null }) {
  const entries = Object.entries(utm ?? {}).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 8);
  if (!entries.length) return <p className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">No campaign attribution values are attached.</p>;
  return <div className="mt-5 border-t border-[var(--color-border)] pt-5"><h3 className="text-sm font-semibold text-[var(--color-foreground)]">Campaign attribution</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{entries.map(([key, value]) => <BusinessField key={key} label={formatLabel(key)} value={String(value)} />)}</dl></div>;
}

function OverviewFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"><dt className="flex items-center gap-2 text-xs text-[var(--color-muted)]">{icon}{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--color-foreground)]" title={value}>{value}</dd></div>; }
function BusinessField({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p><p className="mt-1 break-words text-sm text-[var(--color-foreground)]">{value}</p></div>; }
function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"><span className="mt-0.5 text-[var(--color-accent)]">{icon}</span><div className="min-w-0"><p className="text-xs text-[var(--color-muted)]">{label}</p><p className="mt-1 break-words text-sm font-semibold text-[var(--color-foreground)]">{value}</p></div></div>; }
function ownerLabel(lead: CrmLead) { return lead.claimedByOrganization?.name ?? (lead.claimedByBroker ? brokerName(lead.claimedByBroker) : null) ?? (lead.claimedByOrganizationId || lead.claimedByBrokerUserId || lead.unavailable ? "Claimed" : "Unclaimed"); }
function brokerName(broker: { firstName?: string | null; lastName?: string | null; id: string }) { return [broker.firstName, broker.lastName].filter(Boolean).join(" ") || "Assigned broker"; }
function formatLabel(value: string) { return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
