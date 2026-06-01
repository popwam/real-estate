"use client";

import Link from "next/link";
import { ImportJobsTable } from "@/components/admin-import-export/import-jobs-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useImportJobs } from "@/hooks/use-admin-import-export";

export function ImportJobsPageContent({
  basePath,
  previewPath,
}: {
  basePath: string;
  previewPath?: string;
}) {
  const { data = [], isLoading, error } = useImportJobs();

  return (
    <>
      <PageHeader
        title="Import jobs"
        description="Import job history scoped by backend authorization."
        actions={
          previewPath ? (
            <Link className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800" href={previewPath}>
              New import preview
            </Link>
          ) : null
        }
      />
      <DetailCard title="Job history">
        {isLoading ? <LoadingState label="Loading import jobs" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? <ImportJobsTable basePath={basePath} jobs={data} /> : null}
      </DetailCard>
    </>
  );
}
