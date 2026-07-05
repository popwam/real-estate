"use client";

import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useOperationList } from "@/hooks/use-admin-operations";
import { useI18n } from "@/i18n";

export function OperationsSummaryPage({
  title,
  description,
  path,
  queryKey,
}: {
  title: string;
  description: string;
  path: string;
  queryKey: string;
}) {
  const { t } = useI18n();

  const { data, isLoading, error } = useOperationList(queryKey, path);
  const summary = data as unknown as Record<string, unknown> | undefined;

  return (
    <>
      <PageHeader title={title} description={description} />
      <DetailCard title={t("adminSweep.summary.12b71c3e")}>
        {isLoading ? <LoadingState label={`Loading ${title}`} /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(summary ?? {}).map(([key, value]) => (
              <div className="rounded-md border border-zinc-200 p-4" key={key}>
                <dt className="text-xs font-medium uppercase text-zinc-500">{key}</dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-950">{String(value ?? "-")}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </DetailCard>
    </>
  );
}
