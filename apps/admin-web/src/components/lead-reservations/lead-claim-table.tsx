"use client";

import Link from "next/link";
import { LeadClaimStatusBadge } from "@/components/lead-reservations/badges";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { LeadClaim } from "@/types/lead-reservations";

export function LeadClaimTable({
  claims,
  basePath,
  onRelease,
  isReleasing,
}: {
  claims: LeadClaim[];
  basePath: string;
  onRelease?: (id: string) => void;
  isReleasing?: boolean;
}) {
  return (
    <DataTable<LeadClaim>
      columns={[
        { key: "status", header: "Status", cell: (row) => <LeadClaimStatusBadge status={row.status} /> },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
        { key: "unit", header: "Unit", cell: (row) => row.unit?.unitNumber ?? row.unitId ?? "Project claim" },
        { key: "client", header: "Client", cell: (row) => safeClientLabel(row) },
        { key: "expiresAt", header: "Expires", cell: (row) => formatDate(row.expiresAt) },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex flex-wrap gap-2">
              <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
                Open
              </Link>
              {onRelease && row.status === "ACTIVE" ? (
                <Button className="h-8 bg-white px-2 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" disabled={isReleasing} onClick={() => onRelease(row.id)}>
                  Release
                </Button>
              ) : null}
            </div>
          ),
        },
      ]}
      data={claims}
      emptyTitle="No lead claims yet"
      emptyDescription="Lead claims created by brokers will appear here."
    />
  );
}

export function safeClientLabel(claim: LeadClaim) {
  const name = claim.client?.name ?? "Client";
  const last4 = claim.client?.phoneLast4 ? `last4 ${claim.client.phoneLast4}` : "phone masked";
  return `${name} (${last4})`;
}
