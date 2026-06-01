"use client";

import { ReservationRequestTable } from "@/components/lead-reservations/reservation-request-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import {
  useApproveReservationRequest,
  useRejectReservationRequest,
  useReservationRequests,
} from "@/hooks/use-lead-reservations";

export default function DeveloperReservationRequestsPage() {
  const { data = [], isLoading, error } = useReservationRequests();
  const approve = useApproveReservationRequest();
  const reject = useRejectReservationRequest();

  return (
    <>
      <PageHeader
        title="Reservation Requests"
        description="Review broker reservation requests for developer projects. Approval places the requested unit on hold."
      />
      <DetailCard title="Reservation Queue">
        {isLoading ? <LoadingState label="Loading reservation requests" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? (
          <ReservationRequestTable
            requests={data}
            basePath="/developer/reservation-requests"
            mode="developer"
            isWorking={approve.isPending || reject.isPending}
            error={approve.error ?? reject.error}
            onApprove={(id) => approve.mutateAsync(id)}
            onReject={(id, reason) => reject.mutateAsync({ id, reason })}
          />
        ) : null}
      </DetailCard>
    </>
  );
}
