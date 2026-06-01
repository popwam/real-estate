"use client";

import { useMemo, useState } from "react";
import { PublicLeadsTable } from "@/components/admin-public/public-leads-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import {
  useConvertPublicLeadPlaceholder,
  useMarkPublicLeadSpam,
  usePublicLeads,
  useUpdatePublicLeadStatus,
} from "@/hooks/use-admin-public";
import type { PublicLeadStatus } from "@/types/admin-public";

export function PublicLeadsPageContent({ basePath }: { basePath: string }) {
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
      <PageHeader title="Public leads" description="Website and public marketplace inquiries scoped by backend authorization." />
      <DetailCard
        title="Lead inbox"
        actions={
          <select
            className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            value={status}
            onChange={(event) => setStatus(event.target.value as PublicLeadStatus | "ALL")}
          >
            <option value="ALL">All statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="CONVERTED">Converted</option>
            <option value="SPAM">Spam</option>
          </select>
        }
      >
        {isLoading ? <LoadingState label="Loading public leads" /> : null}
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
