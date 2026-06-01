"use client";

import { useParams } from "next/navigation";
import { ConversationDetailView } from "@/components/admin-crm/conversation-detail-view";

export default function BrokerageConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ConversationDetailView id={id} />;
}
