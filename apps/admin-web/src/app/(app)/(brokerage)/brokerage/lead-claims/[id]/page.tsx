"use client";

import { useParams } from "next/navigation";
import { LeadClaimStatusBadge } from "@/components/lead-reservations/badges";
import { ReservationRequestForm } from "@/components/lead-reservations/reservation-request-form";
import { safeClientLabel } from "@/components/lead-reservations/lead-claim-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCreateReservationRequest, useLeadClaim, useReleaseLeadClaim } from "@/hooks/use-lead-reservations";
import { formatDate } from "@/lib/format";

export default function BrokerageLeadClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: claim, isLoading, error } = useLeadClaim(id);
  const release = useReleaseLeadClaim();
  const createReservation = useCreateReservationRequest();

  if (isLoading) return <LoadingState label="Loading lead claim" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!claim) return null;

  return (
    <>
      <PageHeader
        title="Lead Claim Detail"
        description="Safe lead claim details for brokerage follow-up."
        actions={claim.status === "ACTIVE" ? <Button onClick={() => release.mutate(id)} disabled={release.isPending}>Release claim</Button> : null}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DetailCard title="Claim Summary">
          <DetailGrid items={[
            { label: "Status", value: <LeadClaimStatusBadge status={claim.status} /> },
            { label: "Client", value: safeClientLabel(claim) },
            { label: "Project", value: claim.project?.name ?? claim.projectId },
            { label: "Unit", value: claim.unit?.unitNumber ?? claim.unitId ?? "Project claim" },
            { label: "Expires", value: formatDate(claim.expiresAt) },
            { label: "Created", value: formatDate(claim.createdAt) },
          ]} />
        </DetailCard>
        <DetailCard title="Create Reservation">
          <ReservationRequestForm
            defaultLeadClaimId={claim.id}
            isPending={createReservation.isPending}
            error={createReservation.error}
            onSubmit={(input) => createReservation.mutateAsync(input)}
          />
        </DetailCard>
      </div>
    </>
  );
}
