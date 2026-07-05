"use client";

import { DealRoomStatusBadge } from "@/components/deal-rooms/badges";
import { brokerName } from "@/components/deal-rooms/deal-room-table";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { formatDate } from "@/lib/format";
import type { DealRoom } from "@/types/deal-rooms";
import { useI18n } from "@/i18n";

export function DealRoomSummaryCard({ room }: { room: DealRoom }) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <DetailCard title={t("adminSweep.deal.room.summary.436bb43d")}>
        <DetailGrid items={[
          { label: "Status", value: <DealRoomStatusBadge status={room.status} /> },
          { label: "Project", value: room.project?.name ?? room.projectId },
          { label: "Unit", value: room.unit?.unitNumber ?? room.unitId },
          { label: "Broker", value: brokerName(room) },
          { label: "Brokerage", value: room.brokerage?.name ?? room.brokerageId ?? "Individual broker" },
          { label: "Created", value: formatDate(room.createdAt) },
        ]} />
      </DetailCard>
      <DetailCard title={t("adminSweep.project.and.unit.85a1e07d")}>
        <DetailGrid items={[
          { label: "Project type", value: room.project?.type },
          { label: "Location", value: [room.project?.city, room.project?.district].filter(Boolean).join(", ") || "Not set" },
          { label: "Unit type", value: room.unit?.unitType },
          { label: "Unit status", value: room.unit?.status },
          { label: "Base price", value: room.unit?.basePrice ? `${room.unit.basePrice} ${room.unit.currency ?? ""}` : "Not set" },
          { label: "Area", value: room.unit?.areaSqm ? `${room.unit.areaSqm} sqm` : "Not set" },
        ]} />
      </DetailCard>
      <DetailCard title={t("adminSweep.reservation.and.lead.113e7e12")}>
        <DetailGrid items={[
          { label: "Reservation", value: room.reservationRequest?.status ? `${room.reservationRequest.status.toLowerCase()} request` : "Approved request" },
          { label: "Reservation status", value: room.reservationRequest?.status },
          { label: "Lead claim", value: room.leadClaim?.status ? room.leadClaim.status.toLowerCase() : "Protected lead claim" },
          { label: "Lead source", value: room.lead?.source ?? room.leadClaim?.source },
          { label: "Client", value: room.client?.name ?? "Client" },
          { label: "Client invite", value: room.clientInvitedAt ? formatDate(room.clientInvitedAt) : "Not invited" },
        ]} />
      </DetailCard>
    </div>
  );
}
