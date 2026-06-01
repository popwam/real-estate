"use client";

import { useParams } from "next/navigation";
import { CrmLeadDetailView } from "@/components/admin-crm/crm-lead-detail-view";

export default function DeveloperCrmLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <CrmLeadDetailView conversationsBasePath="/developer/conversations" id={id} />;
}
