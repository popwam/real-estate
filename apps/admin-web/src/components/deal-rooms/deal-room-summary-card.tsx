import { DealRoomStatusBadge } from "@/components/deal-rooms/badges";
import { brokerName } from "@/components/deal-rooms/deal-room-table";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { formatDate } from "@/lib/format";
import type { DealRoom } from "@/types/deal-rooms";

export function DealRoomSummaryCard({ room }: { room: DealRoom }) {
  return (
    <div className="space-y-6">
      <DetailCard title="Deal Room Summary">
        <DetailGrid items={[
          { label: "Status", value: <DealRoomStatusBadge status={room.status} /> },
          { label: "Project", value: room.project?.name ?? room.projectId },
          { label: "Unit", value: room.unit?.unitNumber ?? room.unitId },
          { label: "Broker", value: brokerName(room) },
          { label: "Brokerage", value: room.brokerage?.name ?? room.brokerageId ?? "Individual broker" },
          { label: "Created", value: formatDate(room.createdAt) },
        ]} />
      </DetailCard>
      <DetailCard title="Project And Unit">
        <DetailGrid items={[
          { label: "Project type", value: room.project?.type },
          { label: "Location", value: [room.project?.city, room.project?.district].filter(Boolean).join(", ") || "Not set" },
          { label: "Unit type", value: room.unit?.unitType },
          { label: "Unit status", value: room.unit?.status },
          { label: "Base price", value: room.unit?.basePrice ? `${room.unit.basePrice} ${room.unit.currency ?? ""}` : "Not set" },
          { label: "Area", value: room.unit?.areaSqm ? `${room.unit.areaSqm} sqm` : "Not set" },
        ]} />
      </DetailCard>
      <DetailCard title="Reservation And Lead">
        <DetailGrid items={[
          { label: "Reservation", value: room.reservationRequestId },
          { label: "Reservation status", value: room.reservationRequest?.status },
          { label: "Lead claim", value: room.leadClaimId },
          { label: "Lead source", value: room.lead?.source ?? room.leadClaim?.source },
          { label: "Client", value: room.client?.name ?? "Client" },
          { label: "Client invite", value: room.clientInvitedAt ? formatDate(room.clientInvitedAt) : "Not invited" },
        ]} />
      </DetailCard>
    </div>
  );
}
