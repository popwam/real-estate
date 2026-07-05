"use client";

import { ImportRowErrorsTable } from "@/components/admin-import-export/import-row-errors-table";
import { ImportSummaryCard } from "@/components/admin-import-export/import-summary-card";
import { JsonPreviewBlock } from "@/components/admin-import-export/json-preview-block";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCancelImportJob, useCommitImportJob, useImportJob } from "@/hooks/use-admin-import-export";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/i18n";

export function ImportJobDetailView({ id, jobsBasePath }: { id: string; jobsBasePath: string }) {
  const { t } = useI18n();

  const { data: job, isLoading, error } = useImportJob(id);
  const commit = useCommitImportJob();
  const cancel = useCancelImportJob();

  if (isLoading) return <LoadingState label="Loading import job" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!job) return null;

  const canCancel = job.status === "DRAFT" || job.status === "READY" || job.status === "FAILED";
  const canCommit = job.status !== "COMMITTED" && job.status !== "CANCELLED" && job.validRows > 0;

  return (
    <>
      <PageHeader
        title={`Import job ${job.id}`}
        description="Project and inventory import detail. Commit applies valid rows only and skips invalid rows."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button disabled={!canCommit || commit.isPending} onClick={() => commit.mutateAsync(job.id)}>
              {job.status === "COMMITTED" ? "Already committed" : commit.isPending ? "Committing" : "Commit valid rows"}
            </Button>
            <Button
              className="bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
              disabled={!canCancel || cancel.isPending}
              onClick={() => cancel.mutateAsync(job.id)}
            >
              {cancel.isPending ? "Cancelling" : "Cancel job"}
            </Button>
          </div>
        }
      />
      <div className="space-y-6">
        {commit.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{commit.error.message}</p> : null}
        {cancel.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{cancel.error.message}</p> : null}
        <ImportSummaryCard
          job={job}
          jobsBasePath={jobsBasePath}
          commitResult={commit.data}
          isCommitting={commit.isPending}
          onCommit={(jobId) => commit.mutateAsync(jobId)}
        />
        <DetailCard title={t("adminSweep.job.metadata.776b5805")}>
          <DetailGrid
            items={[
              { label: "Type", value: job.type },
              { label: "Organization", value: job.organization?.name ?? job.organizationId },
              { label: "Created by", value: job.createdBy?.email ?? job.createdByUserId },
              { label: "Created", value: formatDate(job.createdAt) },
              { label: "Updated", value: formatDate(job.updatedAt) },
              { label: "Committed", value: formatDate(job.committedAt) },
            ]}
          />
        </DetailCard>
        <DetailCard title={t("adminSweep.summary.json.8a9e0866")}>
          <JsonPreviewBlock value={job.summary ?? {}} />
        </DetailCard>
        <DetailCard title={t("adminSweep.rows.52d0b352")}>
          <ImportRowErrorsTable rows={job.rows ?? []} />
        </DetailCard>
      </div>
    </>
  );
}
