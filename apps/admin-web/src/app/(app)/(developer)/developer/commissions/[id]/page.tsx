"use client";

import { useParams } from "next/navigation";
import { CommissionDetailView } from "@/components/commercial/commission-detail-view";

export default function DeveloperCommissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CommissionDetailView id={id} />;
}
