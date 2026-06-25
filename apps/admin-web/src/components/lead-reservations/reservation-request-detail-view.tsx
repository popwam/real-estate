"use client";

import { useRouter } from "next/navigation";
import { FeedbackState } from "@/components/feedback-state";
import { ReservationActionDialog } from "@/components/lead-reservations/reservation-action-dialog";
import { ReservationStatusBadge } from "@/components/lead-reservations/badges";
import { brokerLabel } from "@/components/lead-reservations/reservation-request-table";
import { ReservationStatusTimeline } from "@/components/lead-reservations/reservation-status-timeline";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCreateDealRoomFromReservation } from "@/hooks/use-deal-rooms";
import { useApproveReservationRequest, useCancelReservationRequest, useRejectReservationRequest, useReservationRequest } from "@/hooks/use-lead-reservations";
import { formatDate } from "@/lib/format";

export function ReservationRequestDetailView({ id, mode }: { id: string; mode: "developer" | "brokerage" }) {
  const router = useRouter();
  const { data: request, isLoading, error } = useReservationRequest(id);
  const approve = useApproveReservationRequest(); const reject = useRejectReservationRequest(); const cancel = useCancelReservationRequest(); const createRoom = useCreateDealRoomFromReservation();
  if (isLoading) return <LoadingState label="Loading reservation request" />;
  if (error) return <FeedbackState tone="error" title="Reservation request could not be loaded" description={error.message} />;
  if (!request) return null;
  const actions = request.status === "PENDING" ? mode === "developer" ? <><ReservationActionDialog action="approve" isPending={approve.isPending} error={approve.error} trigger={<Button>Approve and hold unit</Button>} onConfirm={() => approve.mutateAsync(id)} /><ReservationActionDialog action="reject" isPending={reject.isPending} error={reject.error} trigger={<Button className="bg-[var(--color-danger)] text-white hover:opacity-90">Reject request</Button>} onConfirm={(input) => reject.mutateAsync({ id, reason: input.reason ?? "" })} /></> : <ReservationActionDialog action="cancel" isPending={cancel.isPending} error={cancel.error} trigger={<Button className="ui-button-secondary">Cancel request</Button>} onConfirm={() => cancel.mutateAsync(id)} /> : mode === "developer" && request.status === "APPROVED" ? <Button disabled={createRoom.isPending} onClick={async () => { const room = await createRoom.mutateAsync(id); router.push(`/developer/deal-rooms/${room.id}`); }}>{createRoom.isPending ? "Creating workspace" : "Create deal room"}</Button> : null;
  return <><PageHeader title={request.project?.name ? `${request.project.name} reservation` : "Reservation request"} description={`${request.unit?.unitNumber ? `Unit ${request.unit.unitNumber} · ` : ""}${mode === "developer" ? "Review the request and understand its inventory consequence." : "Track the developer decision and your next available step."}`} actions={actions} />
    {createRoom.error ? <FeedbackState className="mb-6" tone="error" title="Deal room could not be created" description={createRoom.error.message} /> : null}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6"><DetailCard title="Property and parties"><DetailGrid items={[{ label: "Status", value: <ReservationStatusBadge status={request.status} /> }, { label: "Project", value: request.project?.name ?? "Project details unavailable" }, { label: "Unit", value: request.unit?.unitNumber ?? "Unit details unavailable" }, { label: "Unit status", value: request.unit?.status ?? "Not returned" }, { label: "Broker", value: brokerLabel(request) }, { label: "Client", value: request.leadClaim?.client?.name ?? "Client protected by claim" }]} /></DetailCard>
      <DetailCard title="Request context"><DetailGrid items={[{ label: "Submitted", value: formatDate(request.createdAt) }, { label: "Last updated", value: formatDate(request.updatedAt) }, { label: "Lead source", value: request.lead?.source ?? request.leadClaim?.source ?? "Not returned" }, { label: "Request notes", value: request.notes ?? "No notes provided" }, { label: "Developer response", value: request.rejectionReason ?? "No rejection reason" }]} /></DetailCard></div>
      <div className="space-y-6"><DetailCard title="Reservation progress"><ReservationStatusTimeline request={request} /></DetailCard><DetailCard title="What happens next"><p className="text-sm leading-6 text-[var(--color-text-muted)]">{nextStep(request.status, mode)}</p></DetailCard></div>
    </div></>;
}
function nextStep(status: string, mode: "developer" | "brokerage") { if (status === "PENDING") return mode === "developer" ? "Approving the request places the unit on hold under the existing reservation workflow. Reject only with a clear reason." : "The developer has not decided yet. You can cancel while the request remains pending."; if (status === "APPROVED") return mode === "developer" ? "The unit is held. Create a deal room when the parties are ready to negotiate." : "The developer approved the request. Deal-room progression is available through the supported organization workflow."; if (status === "REJECTED") return "The request cannot progress. Review the developer reason before deciding whether to pursue another unit."; return "This request is closed and has no available progression action."; }
