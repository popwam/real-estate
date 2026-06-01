"use client";

import { useParams } from "next/navigation";
import { ReservationStatusBadge } from "@/components/lead-reservations/badges";
import { ReservationActionDialog } from "@/components/lead-reservations/reservation-action-dialog";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCancelReservationRequest, useReservationRequest } from "@/hooks/use-lead-reservations";
import { formatDate } from "@/lib/format";

export default function BrokerageReservationRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: request, isLoading, error } = useReservationRequest(id);
  const cancel = useCancelReservationRequest();

  if (isLoading) return <LoadingState label="Loading reservation request" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!request) return null;

  return (
    <>
      <PageHeader
        title="Reservation Request Detail"
        description="Reservation request status and developer response."
        actions={request.status === "PENDING" ? (
          <ReservationActionDialog
            action="cancel"
            isPending={cancel.isPending}
            error={cancel.error}
            trigger={<Button className="bg-amber-600 hover:bg-amber-700">Cancel request</Button>}
            onConfirm={() => cancel.mutateAsync(id)}
          />
        ) : null}
      />
      <DetailCard title="Request Summary">
        <DetailGrid items={[
          { label: "Status", value: <ReservationStatusBadge status={request.status} /> },
          { label: "Project", value: request.project?.name ?? request.projectId },
          { label: "Unit", value: request.unit?.unitNumber ?? request.unitId },
          { label: "Lead claim", value: request.leadClaimId },
          { label: "Created", value: formatDate(request.createdAt) },
          { label: "Rejection reason", value: request.rejectionReason ?? "None" },
          { label: "Notes", value: request.notes ?? "None" },
        ]} />
      </DetailCard>
    </>
  );
}
