"use client";

import { useParams } from "next/navigation";
import { CrmLeadDetailView } from "@/components/admin-crm/crm-lead-detail-view";

export default function PlatformCrmLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CrmLeadDetailView conversationsBasePath="/platform/conversations" id={id} />;
}
