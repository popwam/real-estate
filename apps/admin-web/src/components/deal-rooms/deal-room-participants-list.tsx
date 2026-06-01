import { DataTable } from "@/components/tables/data-table";
import { formatDate } from "@/lib/format";
import type { DealRoomParticipant } from "@/types/deal-rooms";

export function DealRoomParticipantsList({ participants = [] }: { participants?: DealRoomParticipant[] }) {
  return (
    <DataTable<DealRoomParticipant>
      columns={[
        { key: "role", header: "Role" },
        { key: "status", header: "Status" },
        { key: "display", header: "Participant", cell: (row) => participantDisplay(row) },
        { key: "invitedAt", header: "Invited", cell: (row) => formatDate(row.invitedAt) },
        { key: "joinedAt", header: "Joined", cell: (row) => formatDate(row.joinedAt) },
      ]}
      data={participants}
      emptyTitle="No participants"
      emptyDescription="Participants added to the deal room will appear here."
    />
  );
}

function participantDisplay(participant: DealRoomParticipant) {
  if (participant.user) {
    return [participant.user.firstName, participant.user.lastName].filter(Boolean).join(" ") ||
      participant.user.email;
  }
  if (participant.client) return participant.client.name ?? participant.clientId ?? "Client";
  if (participant.organization) return participant.organization.name;
  return participant.userId ?? participant.clientId ?? participant.organizationId ?? "Unknown";
}
