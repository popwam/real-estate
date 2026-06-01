"use client";

import { useParams } from "next/navigation";
import { DealRoomDetailView } from "@/components/deal-rooms/deal-room-detail-view";

export default function DeveloperDealRoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <DealRoomDetailView id={id} />;
}
