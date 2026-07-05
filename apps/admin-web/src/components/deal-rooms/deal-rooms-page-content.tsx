"use client";

import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";
import { DealRoomTable } from "@/components/deal-rooms/deal-room-table";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useDealRooms } from "@/hooks/use-deal-rooms";
import { dealRoomErrorCopy } from "@/lib/deal-room-error-copy";
import { useI18n } from "@/i18n";

export function DealRoomsPageContent({
  basePath,
  audience,
}: {
  basePath: string;
  audience: "developer" | "brokerage" | "platform";
}) {
  const { t } = useI18n();

  const { data = [], isLoading, error, refetch } = useDealRooms();
  const descriptions = {
    developer: "Coordinate approved reservations with brokers and move qualified negotiations toward a deal.",
    brokerage: "Track negotiation progress, participants, and the next step for your approved reservations.",
    platform: "Review authorized deal-room activity and exceptions across the marketplace.",
  };
  const errorCopy = error ? dealRoomErrorCopy(error) : undefined;

  return (
    <>
      <PageHeader title={t("adminSweep.deal.rooms.260989e9")} description={descriptions[audience]} />
      {!isLoading && !error ? (
        <CommercialSummaryStrip
          items={[
            {
              label: "All rooms",
              value: data.length,
              description: "Authorized negotiation workspaces",
            },
            {
              label: "Active negotiation",
              value: data.filter((room) => room.status === "OPEN" || room.status === "NEGOTIATION").length,
              description: "Open or in negotiation",
            },
            {
              label: "Awaiting approval",
              value: data.filter((room) => room.status === "PENDING_APPROVAL").length,
              description: "Rooms at the approval step",
            },
            {
              label: "Closed outcomes",
              value: data.filter((room) => room.status === "SOLD" || room.status === "CANCELLED").length,
              description: "Sold or cancelled rooms",
            },
          ]}
        />
      ) : null}
      <DetailCard title={audience === "platform" ? "Authorized workspaces" : "Negotiation pipeline"}>
        {isLoading ? <LoadingState label="Loading deal rooms" /> : null}
        {errorCopy ? (
          <FeedbackState
            tone="error"
            title={errorCopy.title}
            description={errorCopy.description}
            action={
              <Button className="ui-button-secondary" onClick={() => void refetch()}>{t("adminSweep.try.again.042c862e")}</Button>
            }
          />
        ) : null}
        {!isLoading && !error ? <DealRoomTable rooms={data} basePath={basePath} /> : null}
      </DetailCard>
    </>
  );
}
