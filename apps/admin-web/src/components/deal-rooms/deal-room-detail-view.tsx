"use client";

import { ClientInviteDialog } from "@/components/deal-rooms/client-invite-dialog";
import { DealRoomMessageComposer } from "@/components/deal-rooms/deal-room-message-composer";
import { DealRoomMessagesTimeline } from "@/components/deal-rooms/deal-room-messages-timeline";
import { DealRoomParticipantForm } from "@/components/deal-rooms/deal-room-participant-form";
import { DealRoomParticipantsList } from "@/components/deal-rooms/deal-room-participants-list";
import { DealRoomStatusActionDialog } from "@/components/deal-rooms/deal-room-status-action-dialog";
import { DealRoomSummaryCard } from "@/components/deal-rooms/deal-room-summary-card";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
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
  if (error) return <FeedbackState tone="error" title="Deal room could not be loaded" description={error.message} />;
  if (!room) return null;

  return (
    <>
      <PageHeader
        title={room.project?.name ? `${room.project.name} negotiation` : "Deal room"}
        description={`${room.unit?.unitNumber ? `Unit ${room.unit.unitNumber} · ` : ""}Coordinate the parties and move this approved reservation through a clear handoff.`}
        actions={
          <>
            <DealRoomStatusActionDialog
              currentStatus={room.status}
              isPending={updateStatus.isPending}
              error={updateStatus.error}
              trigger={<Button className="ui-button-secondary">Update status</Button>}
              onConfirm={(status) => updateStatus.mutateAsync(status)}
            />
            {room.status === "APPROVED" || room.status === "PENDING_APPROVAL" ? (
              <DealActionDialog
                action="finalize"
                defaultDealRoomId={room.id}
                isPending={createDeal.isPending}
                error={createDeal.error}
                trigger={<Button>Finalize as deal</Button>}
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <DealRoomSummaryCard room={room} />
          <DetailCard title="Negotiation activity">
            {messages.isLoading ? <LoadingState label="Loading messages" /> : null}
            {messages.error ? <FeedbackState tone="error" title="Messages could not be loaded" description={messages.error.message} /> : null}
            {!messages.isLoading && !messages.error ? <DealRoomMessagesTimeline messages={messages.data ?? []} /> : null}
            <div className="sticky bottom-0 mt-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-5">
              <DealRoomMessageComposer isPending={createMessage.isPending} error={createMessage.error} onSubmit={(input) => createMessage.mutateAsync(input)} />
            </div>
          </DetailCard>
        </div>
        <div className="space-y-6">
          <DetailCard title="Participants">
            <DealRoomParticipantsList participants={room.participants} />
          </DetailCard>
          <DetailCard title="Invite client">
            <ClientInviteDialog
              isPending={inviteClient.isPending}
              error={inviteClient.error}
              onInvite={() => inviteClient.mutateAsync()}
            />
          </DetailCard>
          <DetailCard title="Add participant">
            <DealRoomParticipantForm
              isPending={addParticipant.isPending}
              error={addParticipant.error}
              onSubmit={(input) => addParticipant.mutateAsync(input)}
            />
          </DetailCard>
        </div>
      </div>
    </>
  );
}
