"use client";

import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { ClaimLeadButton } from "@/components/admin-crm/claim-lead-button";
import { CrmActivityTimeline } from "@/components/admin-crm/crm-activity-timeline";
import { CrmLeadOperationsSection } from "@/components/admin-crm/crm-lead-operations-section";
import { CrmLeadStatusUpdateDialog } from "@/components/admin-crm/crm-lead-status-update-dialog";
import { CrmLeadStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useClaimCrmLead, useCreateConversationFromCrmLead, useCrmLead, useCrmLeadActivities } from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";
import type { CrmActivityListQuery } from "@/types/admin-crm";

export function CrmLeadDetailView({
  id,
  conversationsBasePath,
  showClaimAction = false,
}: {
  id: string;
  conversationsBasePath: string;
  showClaimAction?: boolean;
}) {
  const [activityQuery, setActivityQuery] = useState<CrmActivityListQuery>({ page: 1, pageSize: 20 });
  const { data: lead, isLoading, error } = useCrmLead(id);
  const activities = useCrmLeadActivities(id, activityQuery);
  const claim = useClaimCrmLead();
  const createConversation = useCreateConversationFromCrmLead();

  if (isLoading) return <LoadingState label="Loading CRM lead" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!lead) return null;

  async function openConversation() {
    const conversation = await createConversation.mutateAsync({ crmLeadId: id });
    if (typeof window !== "undefined") {
      window.location.href = `${conversationsBasePath}/${conversation.id}`;
    }
  }

  return (
    <>
      <PageHeader
        title={lead.client?.name ?? `CRM lead ${lead.id}`}
        description="CRM lead detail. Actions stay limited to claim and conversation foundations."
        actions={
          <div className="flex flex-wrap gap-2">
            {showClaimAction ? (
              <ClaimLeadButton
                disabled={Boolean(lead.unavailable || lead.claimedByBrokerUserId)}
                error={claim.error}
                isPending={claim.isPending}
                leadId={lead.id}
                onClaim={(leadId) => claim.mutateAsync(leadId)}
              />
            ) : null}
            <Button className="gap-2" disabled={createConversation.isPending || Boolean(lead.unavailable)} onClick={openConversation}>
              <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              {createConversation.isPending ? "Opening" : "Create/open conversation"}
            </Button>
          </div>
        }
      />
      {createConversation.error ? (
        <p className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{createConversation.error.message}</p>
      ) : null}
      <div className="space-y-5">
        <DetailCard title="Client summary">
          <DetailGrid
            items={[
              { label: "Status", value: <CrmLeadStatusBadge status={lead.status} /> },
              { label: "Status note", value: lead.statusNote ?? "Not set" },
              { label: "Pipeline stage", value: lead.pipelineStage?.name ?? "Not set" },
              { label: "Preferred contact", value: <PreferredContactMethodBadge method={lead.preferredContactMethod} /> },
              { label: "Name", value: lead.client?.name ?? "Not set" },
              { label: "Phone", value: lead.client?.phoneLast4 ? `${lead.client.phone ?? "Phone"} (last4 ${lead.client.phoneLast4})` : lead.client?.phone ?? "Masked" },
              { label: "Email", value: lead.client?.email ?? "Not set" },
              { label: "Client source", value: lead.client?.source ?? "Not set" },
            ]}
          />
        </DetailCard>
        <DetailCard title="Source and project">
          <DetailGrid
            items={[
              { label: "Organization", value: lead.organization?.name ?? lead.organizationId ?? "Not set" },
              { label: "Project", value: lead.project?.name ?? lead.projectId ?? "Not set" },
              { label: "Project status", value: lead.project?.status ?? "Not set" },
              { label: "Project visibility", value: lead.project?.visibility ?? "Not set" },
              { label: "Unit", value: lead.unitId ? "Linked by backend" : "Not linked" },
              { label: "Source page", value: lead.sourcePage ?? "Not set" },
              { label: "Public lead", value: lead.publicLeadId ?? "Not linked" },
              { label: "Created", value: formatDate(lead.createdAt) },
              { label: "Updated", value: formatDate(lead.updatedAt) },
            ]}
          />
        </DetailCard>
        <DetailCard title="Claim status">
          <DetailGrid
            items={[
              { label: "Claimed broker", value: lead.claimedByBroker ? brokerName(lead.claimedByBroker) : lead.claimedByBrokerUserId ?? "Unclaimed" },
              { label: "Claimed organization", value: lead.claimedByOrganization?.name ?? lead.claimedByOrganizationId ?? "Unclaimed" },
              { label: "Claimed at", value: formatDate(lead.claimedAt) },
            ]}
          />
        </DetailCard>
        <DetailCard title="Visitor behavior">
          {lead.visitorBehavior ? (
            <div className="space-y-4">
              <DetailGrid items={[
                { label: "First seen", value: formatDate(lead.visitorBehavior.firstSeenAt) },
                { label: "Last seen", value: formatDate(lead.visitorBehavior.lastSeenAt) },
                { label: "Assigned owner", value: lead.visitorBehavior.assignmentType ?? lead.assignmentType ?? "Unknown" },
                { label: "Assignment reason", value: lead.visitorBehavior.assignmentReason ?? lead.assignmentReason ?? "Unknown" },
                { label: "Time on page", value: `${Math.round(lead.visitorBehavior.totalTimeOnPageMs / 1000)} seconds` },
                { label: "Max scroll depth", value: `${lead.visitorBehavior.maxScrollDepth}%` },
                { label: "Events", value: lead.visitorBehavior.eventCount },
                { label: "Search terms", value: lead.visitorBehavior.searchTerms.join(", ") || "None" },
                { label: "Viewed projects", value: lead.visitorBehavior.viewedProjects.map((project) => project.name).join(", ") || "None" },
                { label: "Sections reached", value: lead.visitorBehavior.sectionsReached.join(", ") || "None" },
              ]} />
              <div className="grid gap-3 md:grid-cols-2">
                <pre className="overflow-auto rounded-md bg-zinc-100 p-3 text-xs">{JSON.stringify({ firstTouch: lead.visitorBehavior.firstTouch, lastTouch: lead.visitorBehavior.lastTouch }, null, 2)}</pre>
                <pre className="overflow-auto rounded-md bg-zinc-100 p-3 text-xs">{JSON.stringify({ paths: lead.visitorBehavior.viewedPaths, filters: lead.visitorBehavior.filters }, null, 2)}</pre>
              </div>
            </div>
          ) : <p className="text-sm text-zinc-500">No pseudonymous visitor context is attached to this lead.</p>}
        </DetailCard>
        <DetailCard title="Update lead status">
          <CrmLeadStatusUpdateDialog leadId={lead.id} currentStatus={lead.status} />
        </DetailCard>
        <DetailCard title="Pipeline, notes, and follow-up">
          <CrmLeadOperationsSection leadId={lead.id} currentStageId={lead.pipelineStageId} />
        </DetailCard>
        <DetailCard title="Conversation">
          <p className="mb-3 text-sm text-zinc-600">
            Create or open the lead conversation. This does not create reservations, deal rooms, deals, or commissions.
          </p>
          <Button disabled={createConversation.isPending || Boolean(lead.unavailable)} onClick={openConversation}>
            {createConversation.isPending ? "Opening conversation" : "Create/open conversation"}
          </Button>
          <Link className="ml-3 text-sm font-medium text-zinc-950 hover:underline" href={conversationsBasePath}>
            View conversations
          </Link>
        </DetailCard>
        <DetailCard title="Activity timeline">
          <CrmActivityTimeline
            activities={activities.data?.items}
            error={activities.error}
            isLoading={activities.isLoading}
            pagination={activities.data?.pagination}
            onPageChange={(page) => setActivityQuery((current) => ({ ...current, page }))}
            onPageSizeChange={(pageSize) => setActivityQuery((current) => ({ ...current, page: 1, pageSize }))}
          />
        </DetailCard>
        <DetailCard title="UTM">
          <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-5 text-zinc-50">
            {JSON.stringify(lead.utm ?? {}, null, 2)}
          </pre>
        </DetailCard>
      </div>
    </>
  );
}

function brokerName(broker: { firstName?: string | null; lastName?: string | null; id: string }) {
  return [broker.firstName, broker.lastName].filter(Boolean).join(" ") || broker.id;
}
