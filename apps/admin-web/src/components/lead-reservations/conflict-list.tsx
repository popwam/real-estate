"use client";

import { ConflictResolutionDialog } from "@/components/lead-reservations/conflict-resolution-dialog";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { LeadClaimConflict, ResolveLeadClaimConflictInput } from "@/types/lead-reservations";
import { useI18n } from "@/i18n";

export function ConflictList({
  conflicts,
  canResolve = false,
  isResolving,
  error,
  onResolve,
}: {
  conflicts: LeadClaimConflict[];
  canResolve?: boolean;
  isResolving?: boolean;
  error?: Error | null;
  onResolve?: (id: string, input: ResolveLeadClaimConflictInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  return (
    <DataTable<LeadClaimConflict>
      columns={[
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
        { key: "existing", header: "Existing claim", cell: (row) => row.existingClaim?.id ?? row.existingClaimId },
        { key: "attemptedBy", header: "Attempted by", cell: (row) => safeAttemptedBy(row) },
        { key: "resolution", header: "Resolution", cell: (row) => row.resolution ?? "Unresolved" },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) =>
            canResolve && onResolve ? (
              <ConflictResolutionDialog
                isPending={isResolving}
                error={error}
                trigger={<Button className="h-8 px-2">{t("adminSweep.resolve.ac7f958c")}</Button>}
                onConfirm={(input) => onResolve(row.id, input)}
              />
            ) : (
              "Review only"
            ),
        },
      ]}
      data={conflicts}
      emptyTitle="No lead claim conflicts"
      emptyDescription="Conflicts will appear here when duplicate lead claims are detected."
    />
  );
}

function safeAttemptedBy(conflict: LeadClaimConflict) {
  if (!conflict.attemptedBy) return "Masked by backend";
  return [conflict.attemptedBy.firstName, conflict.attemptedBy.lastName].filter(Boolean).join(" ") ||
    conflict.attemptedBy.email;
}
