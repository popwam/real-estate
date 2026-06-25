"use client";

import { ReservationRequestForm } from "@/components/lead-reservations/reservation-request-form";
import { ReservationRequestTable } from "@/components/lead-reservations/reservation-request-table";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";
import { useCancelReservationRequest, useCreateReservationRequest, useReservationRequests } from "@/hooks/use-lead-reservations";

export default function BrokerageReservationRequestsPage() {
  const { data = [], isLoading, error } = useReservationRequests();
  const create = useCreateReservationRequest();
  const cancel = useCancelReservationRequest();

  return (
    <>
      <PageHeader title="Reservation Requests" description="Submit an active claim for reservation and follow the developer decision through the next commercial step." />
      {!isLoading && !error ? <CommercialSummaryStrip items={[{ label: "All requests", value: data.length, description: "Requests visible to your brokerage" }, { label: "Awaiting developer", value: data.filter((request) => request.status === "PENDING").length, description: "Requests waiting for a decision" }, { label: "Approved", value: data.filter((request) => request.status === "APPROVED").length, description: "Requests ready to progress" }, { label: "Closed", value: data.filter((request) => request.status === "REJECTED" || request.status === "CANCELLED").length, description: "Rejected or cancelled requests" }]} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <DetailCard title="Request history">
          {isLoading ? <LoadingState label="Loading reservation requests" /> : null}
          {error ? <FeedbackState tone="error" title="Reservation requests could not be loaded" description={error.message} /> : null}
          {!isLoading && !error ? <ReservationRequestTable requests={data} basePath="/brokerage/reservation-requests" mode="brokerage" isWorking={cancel.isPending} error={cancel.error} onCancel={(id) => cancel.mutateAsync(id)} /> : null}
        </DetailCard>
        <DetailCard title="Create reservation request">
          <ReservationRequestForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
      </div>
    </>
  );
}
