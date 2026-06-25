"use client";

import { DealRoomTable } from "@/components/deal-rooms/deal-room-table";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useDealRooms } from "@/hooks/use-deal-rooms";
import { CommercialSummaryStrip } from "@/components/commercial/commercial-summary-strip";

export function DealRoomsPageContent({ basePath, audience }: { basePath: string; audience: "developer" | "brokerage" | "platform" }) {
  const { data = [], isLoading, error } = useDealRooms();
  const descriptions = {
    developer: "Coordinate approved reservations with brokers and move qualified negotiations toward a deal.",
    brokerage: "Track negotiation progress, participants, and the next step for your approved reservations.",
    platform: "Review authorized deal-room activity and exceptions across the marketplace.",
  };
  return <><PageHeader title="Deal Rooms" description={descriptions[audience]} />{!isLoading && !error ? <CommercialSummaryStrip items={[{ label: "All rooms", value: data.length, description: "Authorized negotiation workspaces" }, { label: "Active negotiation", value: data.filter((room) => room.status === "OPEN" || room.status === "NEGOTIATION").length, description: "Open or in negotiation" }, { label: "Awaiting approval", value: data.filter((room) => room.status === "PENDING_APPROVAL").length, description: "Rooms at the approval step" }, { label: "Closed outcomes", value: data.filter((room) => room.status === "SOLD" || room.status === "CANCELLED").length, description: "Sold or cancelled rooms" }]} /> : null}<DetailCard title={audience === "platform" ? "Authorized workspaces" : "Negotiation pipeline"}>{isLoading ? <LoadingState label="Loading deal rooms" /> : null}{error ? <FeedbackState tone="error" title="Deal rooms could not be loaded" description={error.message} /> : null}{!isLoading && !error ? <DealRoomTable rooms={data} basePath={basePath} /> : null}</DetailCard></>;
}
