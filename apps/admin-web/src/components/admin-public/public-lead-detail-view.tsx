"use client";

import { PublicLeadActionDialog } from "@/components/admin-public/public-lead-action-dialog";
import { PublicLeadStatusBadge } from "@/components/admin-public/badges";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  useConvertPublicLeadPlaceholder,
  useMarkPublicLeadSpam,
  usePublicLead,
  useUpdatePublicLeadStatus,
} from "@/hooks/use-admin-public";
import { formatDate } from "@/lib/format";

export function PublicLeadDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const { data: lead, isLoading, error } = usePublicLead(id);
  const updateStatus = useUpdatePublicLeadStatus();
  const markSpam = useMarkPublicLeadSpam();
  const convert = useConvertPublicLeadPlaceholder();
  const actionError = updateStatus.error ?? markSpam.error ?? convert.error;

  if (isLoading) return <LoadingState label={t("publicLeadDetail.loading")} />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!lead) return null;

  const canTransition = lead.status === "NEW" || lead.status === "REVIEWED";

  return (
    <>
      <PageHeader
        title={lead.name}
        description={t("publicLeadDetail.description")}
        actions={
          <div className="flex flex-wrap gap-2">
            {lead.status === "NEW" ? (
              <PublicLeadActionDialog
                action="review"
                error={actionError}
                isPending={updateStatus.isPending}
                trigger={<Button>{t("publicLeadDetail.markReviewed")}</Button>}
                onConfirm={(input) => updateStatus.mutateAsync({ id, input: { status: "REVIEWED", note: input.note } })}
              />
            ) : null}
            {canTransition ? (
              <>
                <PublicLeadActionDialog
                  action="spam"
                  error={actionError}
                  isPending={markSpam.isPending}
                  trigger={<Button className="bg-red-600 hover:bg-red-700">{t("publicLeadDetail.markSpam")}</Button>}
                  onConfirm={() => markSpam.mutateAsync(id)}
                />
                <PublicLeadActionDialog
                  action="convert"
                  error={actionError}
                  isPending={convert.isPending}
                  trigger={<Button className="bg-emerald-700 hover:bg-emerald-800">{t("publicLeadDetail.convertPlaceholder")}</Button>}
                  onConfirm={() => convert.mutateAsync(id)}
                />
              </>
            ) : null}
          </div>
        }
      />
      <div className="space-y-5">
        <DetailCard title={t("publicLeadDetail.leadInformation")}>
          <DetailGrid
            items={[
              { label: t("common.status"), value: <PublicLeadStatusBadge status={lead.status} /> },
              { label: t("publicLeadDetail.phone"), value: lead.phoneLast4 ? `${lead.phone ?? t("publicLeadDetail.phone")} (${t("publicLeadDetail.last4", { value: lead.phoneLast4 })})` : lead.phone ?? t("common.notSet") },
              { label: t("publicLeadDetail.email"), value: lead.email ?? t("common.notSet") },
              { label: t("publicLeadDetail.normalizedEmail"), value: lead.normalizedEmail ?? t("common.notSet") },
              { label: t("publicLeadDetail.sourcePage"), value: lead.sourcePage ?? t("common.notSet") },
              { label: t("publicLeadDetail.consent"), value: lead.consent ? t("common.yes") : t("common.no") },
              { label: t("publicLeadDetail.consentTimestamp"), value: formatDate(lead.consentAt) },
              { label: t("publicLeadDetail.idempotencyKey"), value: lead.idempotencyKey ?? t("common.notSet") },
              { label: t("common.created"), value: formatDate(lead.createdAt) },
              { label: t("common.updated"), value: formatDate(lead.updatedAt) },
              { label: t("publicLeadDetail.statusNote"), value: lead.statusNote ?? t("common.none") },
            ]}
          />
        </DetailCard>
        <DetailCard title={t("publicLeadDetail.organizationProject")}>
          <DetailGrid
            items={[
              { label: t("publicLeadDetail.organization"), value: lead.organization?.name ?? lead.organizationId ?? t("common.notSet") },
              { label: t("publicLeadDetail.organizationType"), value: lead.organization?.type ?? t("common.notSet") },
              { label: t("publicLeadDetail.project"), value: lead.project?.name ?? lead.projectId ?? t("publicLeadDetail.organizationLead") },
              { label: t("publicLeadDetail.projectStatus"), value: lead.project?.status ?? t("common.notSet") },
              { label: t("publicLeadDetail.projectVisibility"), value: lead.project?.visibility ?? t("common.notSet") },
            ]}
          />
        </DetailCard>
        <DetailCard title={t("publicLeadDetail.message")}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{lead.message || t("publicLeadDetail.noMessage")}</p>
        </DetailCard>
        <DetailCard title="UTM">
          <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-5 text-zinc-50">
            {JSON.stringify(lead.utm ?? {}, null, 2)}
          </pre>
        </DetailCard>
        <DetailCard title={t("publicLeadDetail.spamMetadata")}>
          <DetailGrid
            items={[
              { label: t("publicLeadDetail.spamScore"), value: lead.spamScore ?? 0 },
              { label: t("publicLeadDetail.sourceIpHash"), value: lead.sourceIpHash ?? t("common.notSet") },
              { label: t("publicLeadDetail.userAgentHash"), value: lead.userAgentHash ?? t("common.notSet") },
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
