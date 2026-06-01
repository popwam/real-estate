"use client";

import Link from "next/link";
import { PublicLeadActionDialog } from "@/components/admin-public/public-lead-action-dialog";
import { PublicLeadStatusBadge } from "@/components/admin-public/badges";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { PublicLead } from "@/types/admin-public";

export function PublicLeadsTable({
  leads,
  basePath,
  onReview,
  onSpam,
  onConvert,
  isWorking,
  actionError,
}: {
  leads: PublicLead[];
  basePath: string;
  onReview: (id: string, note?: string) => Promise<unknown>;
  onSpam: (id: string) => Promise<unknown>;
  onConvert: (id: string) => Promise<unknown>;
  isWorking?: boolean;
  actionError?: Error | null;
}) {
  return (
    <DataTable<PublicLead>
      columns={[
        { key: "status", header: "Status", cell: (row) => <PublicLeadStatusBadge status={row.status} /> },
        { key: "name", header: "Name", cell: (row) => row.name },
        { key: "phone", header: "Phone", cell: (row) => row.phoneLast4 ? `last4 ${row.phoneLast4}` : row.phone ?? "Not set" },
        { key: "email", header: "Email", cell: (row) => row.email ?? "Not set" },
        { key: "spamScore", header: "Spam", cell: (row) => row.spamScore ?? 0 },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId ?? "Organization lead" },
        { key: "sourcePage", header: "Source", cell: (row) => row.sourcePage ?? "Not set" },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex flex-wrap gap-2">
              <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
                Open
              </Link>
              {row.status === "NEW" ? (
                <PublicLeadActionDialog
                  action="review"
                  error={actionError}
                  isPending={isWorking}
                  trigger={<Button className="h-8 bg-white px-2 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50">Review</Button>}
                  onConfirm={(input) => onReview(row.id, input.note)}
                />
              ) : null}
              {row.status === "NEW" || row.status === "REVIEWED" ? (
                <>
                  <PublicLeadActionDialog
                    action="spam"
                    error={actionError}
                    isPending={isWorking}
                    trigger={<Button className="h-8 bg-white px-2 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50">Spam</Button>}
                    onConfirm={() => onSpam(row.id)}
                  />
                  <PublicLeadActionDialog
                    action="convert"
                    error={actionError}
                    isPending={isWorking}
                    trigger={<Button className="h-8 bg-white px-2 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50">Convert</Button>}
                    onConfirm={() => onConvert(row.id)}
                  />
                </>
              ) : null}
            </div>
          ),
        },
      ]}
      data={leads}
      emptyTitle="No public leads yet"
      emptyDescription="Website and public marketplace form submissions will appear here."
    />
  );
}
