"use client";

import { useParams, useRouter } from "next/navigation";
import { ReservationStatusBadge } from "@/components/lead-reservations/badges";
import { ReservationActionDialog } from "@/components/lead-reservations/reservation-action-dialog";
import { brokerLabel } from "@/components/lead-reservations/reservation-request-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCreateDealRoomFromReservation as useCreateDealRoom } from "@/hooks/use-deal-rooms";
import {
  useApproveReservationRequest,
  useRejectReservationRequest,
  useReservationRequest,
} from "@/hooks/use-lead-reservations";
import { formatDate } from "@/lib/format";

export default function DeveloperReservationRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: request, isLoading, error } = useReservationRequest(id);
  const approve = useApproveReservationRequest();
  const reject = useRejectReservationRequest();
  const createDealRoom = useCreateDealRoom();

  if (isLoading) return <LoadingState label="Loading reservation request" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!request) return null;

  return (
    <>
      <PageHeader
        title="Reservation Request Detail"
        description="Approve or reject a pending reservation request. Approval will hold the unit."
        actions={request.status === "PENDING" ? (
          <>
            <ReservationActionDialog
              action="approve"
              isPending={approve.isPending}
              error={approve.error}
              trigger={<Button>Approve and hold unit</Button>}
              onConfirm={() => approve.mutateAsync(id)}
            />
            <ReservationActionDialog
              action="reject"
              isPending={reject.isPending}
              error={reject.error}
              trigger={<Button className="bg-red-600 hover:bg-red-700">Reject</Button>}
              onConfirm={(input) => reject.mutateAsync({ id, reason: input.reason ?? "" })}
            />
          </>
        ) : request.status === "APPROVED" ? (
          <Button
            disabled={createDealRoom.isPending}
            onClick={async () => {
              const room = await createDealRoom.mutateAsync(id);
              router.push(`/developer/deal-rooms/${room.id}`);
            }}
          >
            {createDealRoom.isPending ? "Creating" : "Create deal room"}
          </Button>
        ) : null}
      />
      {createDealRoom.error ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{createDealRoom.error.message}</p> : null}
      <DetailCard title="Request Summary">
        <DetailGrid items={[
          { label: "Status", value: <ReservationStatusBadge status={request.status} /> },
          { label: "Broker", value: brokerLabel(request) },
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
