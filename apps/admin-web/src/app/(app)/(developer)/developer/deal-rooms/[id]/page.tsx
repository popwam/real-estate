"use client";

import { useParams } from "next/navigation";
import { DealRoomDetailView } from "@/components/deal-rooms/deal-room-detail-view";

export default function DeveloperDealRoomDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <DealRoomDetailView id={id} />;
}
