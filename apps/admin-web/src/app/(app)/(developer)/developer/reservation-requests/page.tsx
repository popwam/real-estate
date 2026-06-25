"use client";

import { ReservationRequestTable } from "@/components/lead-reservations/reservation-request-table";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";
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
        description="Prioritize pending broker requests and make the unit impact clear before approving or rejecting."
      />
      {!isLoading && !error ? <CommercialSummaryStrip items={[{ label: "All requests", value: data.length, description: "Requests for your projects" }, { label: "Pending decision", value: data.filter((request) => request.status === "PENDING").length, description: "Requests requiring review" }, { label: "Approved", value: data.filter((request) => request.status === "APPROVED").length, description: "Units held through approval" }, { label: "Closed", value: data.filter((request) => request.status === "REJECTED" || request.status === "CANCELLED").length, description: "Rejected or cancelled requests" }]} /> : null}
      <DetailCard title="Reservation Queue">
        {isLoading ? <LoadingState label="Loading reservation requests" /> : null}
        {error ? <FeedbackState tone="error" title="Reservation requests could not be loaded" description={error.message} /> : null}
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
