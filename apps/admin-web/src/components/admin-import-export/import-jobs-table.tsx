"use client";

import Link from "next/link";
import { ImportJobStatusBadge } from "@/components/admin-import-export/badges";
import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { ImportJob } from "@/types/admin-import-export";

export function ImportJobsTable({ jobs, basePath }: { jobs: ImportJob[]; basePath: string }) {
  return (
    <DataTable<ImportJob>
      columns={[
        { key: "id", header: "Job", cell: (row) => <code className="text-xs">{row.id}</code> },
        { key: "status", header: "Status", cell: (row) => <ImportJobStatusBadge status={row.status} /> },
        { key: "sourceFormat", header: "Format", cell: (row) => row.sourceFormat },
        { key: "totalRows", header: "Rows", cell: (row) => row.totalRows },
        { key: "validRows", header: "Valid", cell: (row) => row.validRows },
        { key: "invalidRows", header: "Invalid", cell: (row) => row.invalidRows },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        { key: "committedAt", header: "Committed", cell: (row) => formatDate(row.committedAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
              View
            </Link>
          ),
        },
      ]}
      data={jobs}
      emptyTitle="No import jobs yet"
      emptyDescription="Project and inventory import previews will appear here."
    />
  );
}
