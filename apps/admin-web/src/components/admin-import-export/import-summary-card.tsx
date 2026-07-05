"use client";

import Link from "next/link";
import { ImportJobStatusBadge } from "@/components/admin-import-export/badges";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ImportCommitResponse, ImportJob, ImportPreviewResponse } from "@/types/admin-import-export";
import { useI18n } from "@/i18n";

export function ImportSummaryCard({
  preview,
  job,
  commitResult,
  jobsBasePath,
  onCommit,
  isCommitting,
}: {
  preview?: ImportPreviewResponse | null;
  job?: ImportJob | null;
  commitResult?: ImportCommitResponse | null;
  jobsBasePath?: string;
  onCommit?: (id: string) => Promise<unknown>;
  isCommitting?: boolean;
}) {
  const { t } = useI18n();

  const jobId = preview?.jobId ?? job?.id ?? commitResult?.jobId;
  const validRows = preview?.validRows ?? job?.validRows ?? 0;
  const status = job?.status ?? commitResult?.status;
  const canCommit = Boolean(jobId && validRows > 0 && status !== "COMMITTED" && status !== "CANCELLED");

  return (
    <DetailCard
      title={t("adminSweep.import.summary.2f1bd454")}
      actions={
        <div className="flex flex-wrap gap-2">
          {jobsBasePath && jobId ? (
            <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50" href={`${jobsBasePath}/${jobId}`}>{t("adminSweep.view.job.1c1b839b")}</Link>
          ) : null}
          {onCommit && jobId ? (
            <Button disabled={!canCommit || isCommitting} onClick={() => onCommit(jobId)}>
              {isCommitting ? "Committing" : status === "COMMITTED" ? "Already committed" : "Commit valid rows"}
            </Button>
          ) : null}
        </div>
      }
    >
      <DetailGrid
        items={[
          { label: "Job", value: jobId ?? "Not created" },
          { label: "Status", value: status ? <ImportJobStatusBadge status={status} /> : "Preview created" },
          { label: "Source format", value: job?.sourceFormat ?? "Not set" },
          { label: "Original file", value: job?.originalFileName ?? "Not set" },
          { label: "Total rows", value: preview?.totalRows ?? job?.totalRows ?? 0 },
          { label: "Valid rows", value: validRows },
          { label: "Invalid rows", value: preview?.invalidRows ?? job?.invalidRows ?? 0 },
          { label: "Committed", value: formatDate(job?.committedAt) },
        ]}
      />
      {commitResult ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {commitResult.alreadyCommitted ? "This job was already committed. No duplicate records were created." : "Import commit completed."}
        </p>
      ) : null}
    </DetailCard>
  );
}
