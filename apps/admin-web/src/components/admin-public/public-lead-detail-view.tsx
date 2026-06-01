"use client";

import { PublicLeadActionDialog } from "@/components/admin-public/public-lead-action-dialog";
import { PublicLeadStatusBadge } from "@/components/admin-public/badges";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import {
  useConvertPublicLeadPlaceholder,
  useMarkPublicLeadSpam,
  usePublicLead,
  useUpdatePublicLeadStatus,
} from "@/hooks/use-admin-public";
import { formatDate } from "@/lib/format";

export function PublicLeadDetailView({ id }: { id: string }) {
  const { data: lead, isLoading, error } = usePublicLead(id);
  const updateStatus = useUpdatePublicLeadStatus();
  const markSpam = useMarkPublicLeadSpam();
  const convert = useConvertPublicLeadPlaceholder();
  const actionError = updateStatus.error ?? markSpam.error ?? convert.error;

  if (isLoading) return <LoadingState label="Loading public lead" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!lead) return null;

  const canTransition = lead.status === "NEW" || lead.status === "REVIEWED";

  return (
    <>
      <PageHeader
        title={lead.name}
        description="Public lead detail. Conversion is a placeholder and does not create LeadClaim, ReservationRequest, broker assignment, deal, or CRM records."
        actions={
          <div className="flex flex-wrap gap-2">
            {lead.status === "NEW" ? (
              <PublicLeadActionDialog
                action="review"
                error={actionError}
                isPending={updateStatus.isPending}
                trigger={<Button>Mark reviewed</Button>}
                onConfirm={(input) => updateStatus.mutateAsync({ id, input: { status: "REVIEWED", note: input.note } })}
              />
            ) : null}
            {canTransition ? (
              <>
                <PublicLeadActionDialog
                  action="spam"
                  error={actionError}
                  isPending={markSpam.isPending}
                  trigger={<Button className="bg-red-600 hover:bg-red-700">Mark spam</Button>}
                  onConfirm={() => markSpam.mutateAsync(id)}
                />
                <PublicLeadActionDialog
                  action="convert"
                  error={actionError}
                  isPending={convert.isPending}
                  trigger={<Button className="bg-emerald-700 hover:bg-emerald-800">Convert placeholder</Button>}
                  onConfirm={() => convert.mutateAsync(id)}
                />
              </>
            ) : null}
          </div>
        }
      />
      <div className="space-y-5">
        <DetailCard title="Lead information">
          <DetailGrid
            items={[
              { label: "Status", value: <PublicLeadStatusBadge status={lead.status} /> },
              { label: "Phone", value: lead.phoneLast4 ? `${lead.phone ?? "Phone"} (last4 ${lead.phoneLast4})` : lead.phone ?? "Not set" },
              { label: "Email", value: lead.email ?? "Not set" },
              { label: "Normalized email", value: lead.normalizedEmail ?? "Not set" },
              { label: "Source page", value: lead.sourcePage ?? "Not set" },
              { label: "Consent", value: lead.consent ? "Yes" : "No" },
              { label: "Consent timestamp", value: formatDate(lead.consentAt) },
              { label: "Idempotency key", value: lead.idempotencyKey ?? "Not set" },
              { label: "Created", value: formatDate(lead.createdAt) },
              { label: "Updated", value: formatDate(lead.updatedAt) },
              { label: "Status note", value: lead.statusNote ?? "None" },
            ]}
          />
        </DetailCard>
        <DetailCard title="Organization and project">
          <DetailGrid
            items={[
              { label: "Organization", value: lead.organization?.name ?? lead.organizationId ?? "Not set" },
              { label: "Organization type", value: lead.organization?.type ?? "Not set" },
              { label: "Project", value: lead.project?.name ?? lead.projectId ?? "Organization lead" },
              { label: "Project status", value: lead.project?.status ?? "Not set" },
              { label: "Project visibility", value: lead.project?.visibility ?? "Not set" },
            ]}
          />
        </DetailCard>
        <DetailCard title="Message">
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{lead.message || "No message provided."}</p>
        </DetailCard>
        <DetailCard title="UTM">
          <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-5 text-zinc-50">
            {JSON.stringify(lead.utm ?? {}, null, 2)}
          </pre>
        </DetailCard>
        <DetailCard title="Spam and source metadata">
          <DetailGrid
            items={[
              { label: "Spam score", value: lead.spamScore ?? 0 },
              { label: "Source IP hash", value: lead.sourceIpHash ?? "Not set" },
              { label: "User agent hash", value: lead.userAgentHash ?? "Not set" },
            ]}
          />
          <pre className="mt-4 overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-5 text-zinc-50">
            {JSON.stringify(lead.spamSignals ?? {}, null, 2)}
          </pre>
        </DetailCard>
      </div>
    </>
  );
}
