"use client";

import { DealRoomTable } from "@/components/deal-rooms/deal-room-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useDealRooms } from "@/hooks/use-deal-rooms";

export default function DeveloperDealRoomsPage() {
  const { data = [], isLoading, error } = useDealRooms();

  return (
    <>
      <PageHeader title="Deal Rooms" description="Developer deal rooms scoped by the backend to your projects." />
      <DetailCard title="Deal Rooms">
        {isLoading ? <LoadingState label="Loading deal rooms" /> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
        {!isLoading && !error ? <DealRoomTable rooms={data} basePath="/developer/deal-rooms" /> : null}
      </DetailCard>
    </>
  );
}
