"use client";

import Link from "next/link";
import { DealRoomStatusBadge } from "@/components/deal-rooms/badges";
import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { DealRoom } from "@/types/deal-rooms";

export function DealRoomTable({ rooms, basePath }: { rooms: DealRoom[]; basePath: string }) {
  return (
    <DataTable<DealRoom>
      columns={[
        { key: "status", header: "Status", cell: (row) => <DealRoomStatusBadge status={row.status} /> },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
        { key: "unit", header: "Unit", cell: (row) => row.unit?.unitNumber ?? row.unitId },
        { key: "brokerage", header: "Brokerage", cell: (row) => row.brokerage?.name ?? row.brokerageId ?? "Individual broker" },
        { key: "broker", header: "Broker", cell: (row) => brokerName(row) },
        { key: "client", header: "Client", cell: (row) => clientParticipantLabel(row) },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        { key: "updatedAt", header: "Updated", cell: (row) => formatDate(row.updatedAt) },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
              Open
            </Link>
          ),
        },
      ]}
      data={rooms}
      emptyTitle="No deal rooms yet"
      emptyDescription="Approved reservations can be promoted into deal rooms."
    />
  );
}

export function brokerName(room: DealRoom) {
  if (!room.broker) return room.brokerUserId;
  return [room.broker.firstName, room.broker.lastName].filter(Boolean).join(" ") || room.broker.email;
}

export function clientParticipantLabel(room: DealRoom) {
  const participant = room.participants?.find((item) => item.role === "CLIENT");
  if (!participant) return room.clientInvitedAt ? "Invited" : "Not invited";
  return `${participant.status}${participant.client?.name ? ` - ${participant.client.name}` : ""}`;
}
