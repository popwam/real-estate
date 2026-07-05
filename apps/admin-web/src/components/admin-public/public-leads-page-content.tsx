"use client";

import { useMemo, useState } from "react";
import { PublicLeadsTable } from "@/components/admin-public/public-leads-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useI18n } from "@/i18n";
import {
  useConvertPublicLeadPlaceholder,
  useMarkPublicLeadSpam,
  usePublicLeads,
  useUpdatePublicLeadStatus,
} from "@/hooks/use-admin-public";
import type { PublicLeadStatus } from "@/types/admin-public";

export function PublicLeadsPageContent({ basePath }: { basePath: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<PublicLeadStatus | "ALL">("ALL");
  const { data = [], isLoading, error } = usePublicLeads();
  const updateStatus = useUpdatePublicLeadStatus();
  const markSpam = useMarkPublicLeadSpam();
  const convert = useConvertPublicLeadPlaceholder();

  const filtered = useMemo(
    () => (status === "ALL" ? data : data.filter((lead) => lead.status === status)),
    [data, status],
  );
  const actionError = updateStatus.error ?? markSpam.error ?? convert.error;

  return (
    <>
      <PageHeader title={t("publicLeads.title")} description={t("publicLeads.description")} />
      <DetailCard
        title={t("publicLeads.inbox")}
        actions={
          <select
            className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            value={status}
            onChange={(event) => setStatus(event.target.value as PublicLeadStatus | "ALL")}
          >
            <option value="ALL">{t("publicLeads.allStatuses")}</option>
            <option value="NEW">{t("publicLeads.status.new")}</option>
            <option value="REVIEWED">{t("publicLeads.status.reviewed")}</option>
            <option value="CONVERTED">{t("publicLeads.status.converted")}</option>
            <option value="SPAM">{t("publicLeads.status.spam")}</option>
          </select>
        }
      >
        {isLoading ? <LoadingState label={t("publicLeads.loading")} /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? (
          <PublicLeadsTable
            actionError={actionError}
            basePath={basePath}
            isWorking={updateStatus.isPending || markSpam.isPending || convert.isPending}
            leads={filtered}
            onConvert={(id) => convert.mutateAsync(id)}
            onReview={(id, note) => updateStatus.mutateAsync({ id, input: { status: "REVIEWED", note } })}
            onSpam={(id) => markSpam.mutateAsync(id)}
          />
        ) : null}
      </DetailCard>
    </>
  );
}
