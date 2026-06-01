"use client";

import { DomainStatusBadge } from "@/components/admin-public/badges";
import { DomainRejectDialog } from "@/components/admin-public/domain-reject-dialog";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { OrganizationDomain } from "@/types/admin-public";

export function PlatformDomainReviewTable({
  domains,
  isWorking,
  actionError,
  onApprove,
  onReject,
}: {
  domains: OrganizationDomain[];
  isWorking?: boolean;
  actionError?: Error | null;
  onApprove: (id: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
}) {
  return (
    <DataTable<OrganizationDomain>
      columns={[
        { key: "status", header: "Status", cell: (row) => <DomainStatusBadge status={row.status} /> },
        { key: "domain", header: "Domain", cell: (row) => row.domain },
        { key: "type", header: "Type", cell: (row) => row.type.replace("_", " ") },
        { key: "organization", header: "Organization", cell: (row) => row.organization?.name ?? row.organizationId },
        { key: "lastCheckedAt", header: "Last check", cell: (row) => formatDate(row.lastCheckedAt) },
        { key: "statusNote", header: "Note", cell: (row) => row.statusNote ?? "None" },
        { key: "failureReason", header: "Failure", cell: (row) => row.failureReason ?? "None" },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex flex-wrap gap-2">
              <Button className="h-8 bg-white px-2 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50" disabled={isWorking} onClick={() => void onApprove(row.id)}>
                Approve
              </Button>
              <DomainRejectDialog
                error={actionError}
                isPending={isWorking}
                trigger={<Button className="h-8 bg-white px-2 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50">Reject</Button>}
                onConfirm={(reason) => onReject(row.id, reason)}
              />
            </div>
          ),
        },
      ]}
      data={domains}
      emptyTitle="No domain records"
      emptyDescription="Organization domain verification records will appear here."
    />
  );
}
