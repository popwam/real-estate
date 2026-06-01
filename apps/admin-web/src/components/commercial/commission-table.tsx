"use client";

import Link from "next/link";
import { CommissionStatusBadge } from "@/components/commercial/badges";
import { money } from "@/components/commercial/deal-table";
import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { CommissionEntry } from "@/types/commercial";

export function CommissionTable({ commissions, basePath }: { commissions: CommissionEntry[]; basePath: string }) {
  return (
    <DataTable<CommissionEntry>
      columns={[
        { key: "status", header: "Status", cell: (row) => <CommissionStatusBadge status={row.status} /> },
        { key: "amount", header: "Amount", cell: (row) => money(row.amount, row.currency) },
        { key: "partyType", header: "Party" },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
        { key: "unit", header: "Unit", cell: (row) => row.unit?.unitNumber ?? row.unitId },
        { key: "recipient", header: "Recipient", cell: (row) => recipientLabel(row) },
        { key: "dealId", header: "Deal", cell: (row) => row.dealId },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        { key: "actions", header: "Actions", cell: (row) => <Link className="font-medium hover:underline" href={`${basePath}/${row.id}`}>Open</Link> },
      ]}
      data={commissions}
      emptyTitle="No commissions yet"
      emptyDescription="Commission entries are created when eligible deals are finalized."
    />
  );
}

export function recipientLabel(row: CommissionEntry) {
  if (row.recipientOrganization) return row.recipientOrganization.name;
  if (row.recipientUser) {
    return [row.recipientUser.firstName, row.recipientUser.lastName].filter(Boolean).join(" ") || row.recipientUser.email;
  }
  return row.recipientOrganizationId ?? row.recipientUserId ?? row.partyType;
}
