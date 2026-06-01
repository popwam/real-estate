"use client";

import Link from "next/link";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { VerificationStatusBadge } from "@/components/platform/verification-status-badge";
import { DataTable } from "@/components/tables/data-table";
import { useVerificationQueue } from "@/hooks/use-platform-admin";
import { formatDate, formatPlainDate } from "@/lib/format";
import type { Verification } from "@/types/platform";

export default function PlatformVerificationsPage() {
  const { data = [], isLoading, error } = useVerificationQueue();

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Pending verification queue for organization documents awaiting platform review."
      />
      {isLoading ? <LoadingState label="Loading verification queue" /> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
      {!isLoading && !error ? (
        <DataTable<Verification>
          columns={[
            {
              key: "documentType",
              header: "Document",
              cell: (row) => (
                <Link className="font-medium text-zinc-950 hover:underline" href={`/platform/verifications/${row.id}`}>
                  {row.documentType.replaceAll("_", " ")}
                </Link>
              ),
            },
            {
              key: "organization",
              header: "Organization",
              cell: (row) => row.organization?.name ?? row.organizationId,
            },
            { key: "status", header: "Status", cell: (row) => <VerificationStatusBadge status={row.status} /> },
            { key: "expiryDate", header: "Expires", cell: (row) => formatPlainDate(row.expiryDate) },
            { key: "createdAt", header: "Submitted", cell: (row) => formatDate(row.createdAt) },
          ]}
          data={data}
          emptyTitle="No pending verifications"
          emptyDescription="Submitted organization documents awaiting review will appear here."
        />
      ) : null}
    </>
  );
}
