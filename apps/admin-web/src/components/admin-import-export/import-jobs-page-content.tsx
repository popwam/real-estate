"use client";

import Link from "next/link";
import { ImportJobsTable } from "@/components/admin-import-export/import-jobs-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useImportJobs } from "@/hooks/use-admin-import-export";
import { useI18n } from "@/i18n";

export function ImportJobsPageContent({
  basePath,
  previewPath,
}: {
  basePath: string;
  previewPath?: string;
}) {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useImportJobs();

  return (
    <>
      <PageHeader
        title={t("adminSweep.import.jobs.ca93ba38")}
        description="Import job history scoped by backend authorization."
        actions={
          previewPath ? (
            <Link className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800" href={previewPath}>{t("adminSweep.new.import.preview.bb3dedc0")}</Link>
          ) : null
        }
      />
      <DetailCard title={t("adminSweep.job.history.888eaa84")}>
        {isLoading ? <LoadingState label="Loading import jobs" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? <ImportJobsTable basePath={basePath} jobs={data} /> : null}
      </DetailCard>
    </>
  );
}
