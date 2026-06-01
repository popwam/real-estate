"use client";

import { ReservationRequestForm } from "@/components/lead-reservations/reservation-request-form";
import { ReservationRequestTable } from "@/components/lead-reservations/reservation-request-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCancelReservationRequest, useCreateReservationRequest, useReservationRequests } from "@/hooks/use-lead-reservations";

export default function BrokerageReservationRequestsPage() {
  const { data = [], isLoading, error } = useReservationRequests();
  const create = useCreateReservationRequest();
  const cancel = useCancelReservationRequest();

  return (
    <>
      <PageHeader title="Reservation Requests" description="Create and track reservation requests submitted to developers." />
      <div className="space-y-6">
        <DetailCard title="Create Reservation Request">
          <ReservationRequestForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="Requests">
          {isLoading ? <LoadingState label="Loading reservation requests" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <ReservationRequestTable
              requests={data}
              basePath="/brokerage/reservation-requests"
              mode="brokerage"
              isWorking={cancel.isPending}
              error={cancel.error}
              onCancel={(id) => cancel.mutateAsync(id)}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
