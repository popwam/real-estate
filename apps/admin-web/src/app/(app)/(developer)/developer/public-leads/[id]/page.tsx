"use client";

import { useParams } from "next/navigation";
import { PublicLeadDetailView } from "@/components/admin-public/public-lead-detail-view";

export default function DeveloperPublicLeadDetailPage() {
  const params = useParams<{ id: string }>();
  return <PublicLeadDetailView id={params.id} />;
}
