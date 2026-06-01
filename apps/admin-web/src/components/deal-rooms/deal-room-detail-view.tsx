"use client";

import { ClientInviteDialog } from "@/components/deal-rooms/client-invite-dialog";
import { DealRoomMessageComposer } from "@/components/deal-rooms/deal-room-message-composer";
import { DealRoomMessagesTimeline } from "@/components/deal-rooms/deal-room-messages-timeline";
import { DealRoomParticipantForm } from "@/components/deal-rooms/deal-room-participant-form";
import { DealRoomParticipantsList } from "@/components/deal-rooms/deal-room-participants-list";
import { DealRoomStatusActionDialog } from "@/components/deal-rooms/deal-room-status-action-dialog";
import { DealRoomSummaryCard } from "@/components/deal-rooms/deal-room-summary-card";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { DealActionDialog } from "@/components/commercial/deal-action-dialog";
import { useCreateDealFromRoom } from "@/hooks/use-commercial";
import {
  useAddDealRoomParticipant,
  useCreateDealRoomMessage,
  useDealRoom,
  useDealRoomMessages,
  useInviteDealRoomClient,
  useUpdateDealRoomStatus,
} from "@/hooks/use-deal-rooms";

export function DealRoomDetailView({ id }: { id: string }) {
  const { data: room, isLoading, error } = useDealRoom(id);
  const messages = useDealRoomMessages(id);
  const addParticipant = useAddDealRoomParticipant(id);
  const inviteClient = useInviteDealRoomClient(id);
  const updateStatus = useUpdateDealRoomStatus(id);
  const createMessage = useCreateDealRoomMessage(id);
  const createDeal = useCreateDealFromRoom();

  if (isLoading) return <LoadingState label="Loading deal room" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!room) return null;

  return (
    <>
      <PageHeader
        title={`Deal Room ${room.id}`}
        description="Deal room workspace for reservation follow-up, participants, messages, and safe status transitions."
        actions={
          <>
            <DealRoomStatusActionDialog
              currentStatus={room.status}
              isPending={updateStatus.isPending}
              error={updateStatus.error}
              trigger={<Button>Update status</Button>}
              onConfirm={(status) => updateStatus.mutateAsync(status)}
            />
            {room.status === "APPROVED" || room.status === "PENDING_APPROVAL" ? (
              <DealActionDialog
                action="finalize"
                defaultDealRoomId={room.id}
                isPending={createDeal.isPending}
                error={createDeal.error}
                trigger={<Button>Finalize deal</Button>}
                onConfirm={(input) => createDeal.mutateAsync({
                  dealRoomId: room.id,
                  finalPrice: input.finalPrice,
                  currency: input.currency,
                })}
              />
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <DealRoomSummaryCard room={room} />
          <DetailCard title="Participants">
            <DealRoomParticipantsList participants={room.participants} />
          </DetailCard>
          <DetailCard title="Messages">
            {messages.isLoading ? <LoadingState label="Loading messages" /> : null}
            {messages.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{messages.error.message}</p> : null}
            {!messages.isLoading && !messages.error ? <DealRoomMessagesTimeline messages={messages.data ?? []} /> : null}
          </DetailCard>
        </div>
        <div className="space-y-6">
          <DetailCard title="Invite Client">
            <ClientInviteDialog
              isPending={inviteClient.isPending}
              error={inviteClient.error}
              onInvite={() => inviteClient.mutateAsync()}
            />
          </DetailCard>
          <DetailCard title="Add Participant">
            <DealRoomParticipantForm
              isPending={addParticipant.isPending}
              error={addParticipant.error}
              onSubmit={(input) => addParticipant.mutateAsync(input)}
            />
          </DetailCard>
          <DetailCard title="Send Message">
            <DealRoomMessageComposer
              isPending={createMessage.isPending}
              error={createMessage.error}
              onSubmit={(input) => createMessage.mutateAsync(input)}
            />
          </DetailCard>
        </div>
      </div>
    </>
  );
}
