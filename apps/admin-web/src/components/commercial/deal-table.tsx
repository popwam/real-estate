"use client";

import Link from "next/link";
import { DealStatusBadge } from "@/components/commercial/badges";
import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { Deal } from "@/types/commercial";

export function DealTable({ deals, basePath }: { deals: Deal[]; basePath: string }) {
  return (
    <DataTable<Deal>
      columns={[
        { key: "status", header: "Status", cell: (row) => <DealStatusBadge status={row.status} /> },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
        { key: "unit", header: "Unit", cell: (row) => row.unit?.unitNumber ?? row.unitId },
        { key: "brokerage", header: "Brokerage", cell: (row) => row.brokerage?.name ?? row.brokerageId ?? "Individual broker" },
        { key: "broker", header: "Broker", cell: (row) => brokerName(row) },
        { key: "finalPrice", header: "Final price", cell: (row) => money(row.finalPrice, row.currency) },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        { key: "soldAt", header: "Sold", cell: (row) => formatDate(row.soldAt) },
        { key: "actions", header: "Actions", cell: (row) => <Link className="font-medium hover:underline" href={`${basePath}/${row.id}`}>Open</Link> },
      ]}
      data={deals}
      emptyTitle="No deals yet"
      emptyDescription="Finalized deal records will appear here."
    />
  );
}

export function brokerName(deal: Deal) {
  if (!deal.broker) return deal.brokerUserId;
  return [deal.broker.firstName, deal.broker.lastName].filter(Boolean).join(" ") || deal.broker.email;
}

export function money(value?: string | number | null, currency = "EGP") {
  if (value === undefined || value === null || value === "") return "Not set";
  return `${value} ${currency}`;
}
