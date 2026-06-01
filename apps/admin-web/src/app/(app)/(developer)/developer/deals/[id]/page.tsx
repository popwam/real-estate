"use client";

import { useParams } from "next/navigation";
import { DealDetailView } from "@/components/commercial/deal-detail-view";

export default function DeveloperDealDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <DealDetailView id={id} />;
}
