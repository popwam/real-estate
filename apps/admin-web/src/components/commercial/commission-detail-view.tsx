"use client";

import { CommissionActionDialog } from "@/components/commercial/commission-action-dialog";
import { CommissionStatusBadge } from "@/components/commercial/badges";
import { money } from "@/components/commercial/deal-table";
import { recipientLabel } from "@/components/commercial/commission-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useApproveCommission, useCommission, useRejectCommission } from "@/hooks/use-commercial";
import { formatDate } from "@/lib/format";

export function CommissionDetailView({ id }: { id: string }) {
  const { data: commission, isLoading, error } = useCommission(id);
  const approve = useApproveCommission();
  const reject = useRejectCommission();

  if (isLoading) return <LoadingState label="Loading commission" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!commission) return null;

  return (
    <>
      <PageHeader
        title={`Commission ${commission.id}`}
        description="Commission approval workflow. Paid and settlement actions are intentionally not implemented."
        actions={commission.status === "PENDING" ? (
          <>
            <CommissionActionDialog action="approve" isPending={approve.isPending} error={approve.error} trigger={<Button>Approve</Button>} onConfirm={() => approve.mutateAsync(id)} />
            <CommissionActionDialog action="reject" isPending={reject.isPending} error={reject.error} trigger={<Button className="bg-red-600 hover:bg-red-700">Reject</Button>} onConfirm={(input) => reject.mutateAsync({ id, reason: input.reason ?? "" })} />
          </>
        ) : null}
      />
      <DetailCard title="Commission Summary">
        <DetailGrid items={[
          { label: "Status", value: <CommissionStatusBadge status={commission.status} /> },
          { label: "Amount", value: money(commission.amount, commission.currency) },
          { label: "Party type", value: commission.partyType },
          { label: "Commission type", value: commission.commissionType ?? "Not set" },
          { label: "Recipient", value: recipientLabel(commission) },
          { label: "Deal", value: commission.dealId },
          { label: "Project", value: commission.project?.name ?? commission.projectId },
          { label: "Unit", value: commission.unit?.unitNumber ?? commission.unitId },
          { label: "Brokerage", value: commission.brokerage?.name ?? commission.brokerageId ?? "None" },
          { label: "Created", value: formatDate(commission.createdAt) },
          { label: "Approved", value: formatDate(commission.approvedAt) },
          { label: "Rejected", value: formatDate(commission.rejectedAt) },
          { label: "Rejection reason", value: commission.rejectionReason ?? "None" },
        ]} />
      </DetailCard>
    </>
  );
}
