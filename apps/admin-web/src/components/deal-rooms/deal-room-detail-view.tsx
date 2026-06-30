"use client";

import { ClientInviteDialog } from "@/components/deal-rooms/client-invite-dialog";
import { DealRoomMessageComposer } from "@/components/deal-rooms/deal-room-message-composer";
import { DealRoomMessagesTimeline } from "@/components/deal-rooms/deal-room-messages-timeline";
import { DealRoomParticipantForm } from "@/components/deal-rooms/deal-room-participant-form";
import { DealRoomParticipantsList } from "@/components/deal-rooms/deal-room-participants-list";
import { DealRoomStatusActionDialog } from "@/components/deal-rooms/deal-room-status-action-dialog";
import { DealRoomSummaryCard } from "@/components/deal-rooms/deal-room-summary-card";
import { DealActionDialog } from "@/components/commercial/deal-action-dialog";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCreateDealFromRoom } from "@/hooks/use-commercial";
import {
  useAddDealRoomParticipant,
  useCreateDealRoomMessage,
  useDealRoom,
  useDealRoomMessages,
  useInviteDealRoomClient,
  useUpdateDealRoomStatus,
} from "@/hooks/use-deal-rooms";
import { dealRoomErrorCopy } from "@/lib/deal-room-error-copy";
import { useI18n } from "@/i18n";

export function DealRoomDetailView({ id }: { id?: string }) {
  const { t } = useI18n();
  const dealRoomId = id?.trim() ?? "";
  const { data: room, isLoading, error, refetch } = useDealRoom(dealRoomId);
  const messages = useDealRoomMessages(dealRoomId);
  const addParticipant = useAddDealRoomParticipant(dealRoomId);
  const inviteClient = useInviteDealRoomClient(dealRoomId);
  const updateStatus = useUpdateDealRoomStatus(dealRoomId);
  const createMessage = useCreateDealRoomMessage(dealRoomId);
  const createDeal = useCreateDealFromRoom();

  if (!dealRoomId) {
    return (
      <FeedbackState
        tone="error"
        title={t("dealRooms.notFound")}
        description={t("dealRooms.missingRouteId")}
      />
    );
  }

  if (isLoading) return <LoadingState label={t("dealRooms.loading")} />;

  if (error) {
    const copy = dealRoomErrorCopy(error);
    return (
      <FeedbackState
        tone="error"
        title={copy.title}
        description={copy.description}
        action={
          <Button className="ui-button-secondary" onClick={() => void refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  if (!room) {
    return (
      <FeedbackState
        tone="error"
        title={t("dealRooms.notFound")}
        description={t("dealRooms.noApiRoom")}
      />
    );
  }

  const messageError = messages.error ? dealRoomErrorCopy(messages.error) : undefined;
  const description = room.unit?.unitNumber
    ? t("dealRooms.descriptionWithUnit", { unit: room.unit.unitNumber })
    : t("dealRooms.description");

  return (
    <>
      <PageHeader
        title={room.project?.name ? t("dealRooms.projectNegotiation", { name: room.project.name }) : t("dealRooms.title")}
        description={description}
        actions={
          <>
            <DealRoomStatusActionDialog
              currentStatus={room.status}
              isPending={updateStatus.isPending}
              error={updateStatus.error}
              trigger={<Button className="ui-button-secondary">{t("dealRooms.updateStatus")}</Button>}
              onConfirm={(status) => updateStatus.mutateAsync(status)}
            />
            {room.status === "APPROVED" || room.status === "PENDING_APPROVAL" ? (
              <DealActionDialog
                action="finalize"
                defaultDealRoomId={room.id}
                isPending={createDeal.isPending}
                error={createDeal.error}
                trigger={<Button>{t("dealRooms.finalizeAsDeal")}</Button>}
                onConfirm={(input) =>
                  createDeal.mutateAsync({
                    dealRoomId: room.id,
                    finalPrice: input.finalPrice,
                    currency: input.currency,
                  })
                }
              />
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <DealRoomSummaryCard room={room} />
          <DetailCard title={t("dealRooms.negotiationActivity")}>
            {messages.isLoading ? <LoadingState label={t("dealRooms.loadingMessages")} /> : null}
            {messageError ? (
              <FeedbackState
                tone="error"
                title={messageError.title}
                description={messageError.description}
                action={
                  <Button className="ui-button-secondary" onClick={() => void messages.refetch()}>
                    {t("common.retry")}
                  </Button>
                }
              />
            ) : null}
            {!messages.isLoading && !messages.error ? (
              <DealRoomMessagesTimeline messages={messages.data ?? []} />
            ) : null}
            {!messages.error ? (
              <div className="sticky bottom-0 mt-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-5">
                <DealRoomMessageComposer
                  isPending={createMessage.isPending}
                  error={createMessage.error}
                  onSubmit={(input) => createMessage.mutateAsync(input)}
                />
              </div>
            ) : null}
          </DetailCard>
        </div>
        <div className="space-y-6">
          <DetailCard title={t("dealRooms.participants")}>
            <DealRoomParticipantsList participants={room.participants} />
          </DetailCard>
          <DetailCard title={t("dealRooms.inviteClient")}>
            <ClientInviteDialog
              isPending={inviteClient.isPending}
              error={inviteClient.error}
              onInvite={() => inviteClient.mutateAsync()}
            />
          </DetailCard>
          <DetailCard title={t("dealRooms.addParticipant")}>
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
