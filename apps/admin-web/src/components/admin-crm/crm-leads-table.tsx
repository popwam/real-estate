"use client";

import Link from "next/link";
import { ClaimLeadButton } from "@/components/admin-crm/claim-lead-button";
import { CrmLeadStatusBadge, PreferredContactMethodBadge } from "@/components/admin-crm/badges";
import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { CrmLead } from "@/types/admin-crm";

export function CrmLeadsTable({
  leads,
  basePath,
  showClaimAction,
  isClaiming,
  claimError,
  onClaim,
}: {
  leads: CrmLead[];
  basePath: string;
  showClaimAction?: boolean;
  isClaiming?: boolean;
  claimError?: Error | null;
  onClaim?: (id: string) => Promise<unknown>;
}) {
  return (
    <DataTable<CrmLead>
      columns={[
        { key: "status", header: "Status", cell: (row) => <CrmLeadStatusBadge status={row.status} /> },
        { key: "client", header: "Client", cell: (row) => row.client?.name ?? "Not set" },
        { key: "phone", header: "Phone", cell: (row) => row.client?.phoneLast4 ? `last4 ${row.client.phoneLast4}` : row.client?.phone ?? "Masked" },
        { key: "email", header: "Email", cell: (row) => row.client?.email ?? "Not set" },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId ?? "Not set" },
        { key: "preferredContactMethod", header: "Contact", cell: (row) => <PreferredContactMethodBadge method={row.preferredContactMethod} /> },
        { key: "claimedByOrganization", header: "Claimed by", cell: (row) => row.claimedByOrganization?.name ?? row.claimedByOrganizationId ?? (row.unavailable ? "Claimed" : "Unclaimed") },
        { key: "sourcePage", header: "Source", cell: (row) => row.sourcePage ?? "Not set" },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex flex-wrap items-center gap-2">
              {!row.unavailable ? (
                <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
                  Open
                </Link>
              ) : null}
              {showClaimAction && onClaim ? (
                <ClaimLeadButton
                  disabled={row.unavailable || Boolean(row.claimedByBrokerUserId)}
                  error={claimError}
                  isPending={isClaiming}
                  leadId={row.id}
                  onClaim={onClaim}
                />
              ) : null}
            </div>
          ),
        },
      ]}
      data={leads}
      emptyTitle="No CRM leads yet"
      emptyDescription="Converted public leads and scoped CRM leads will appear here."
    />
  );
}
