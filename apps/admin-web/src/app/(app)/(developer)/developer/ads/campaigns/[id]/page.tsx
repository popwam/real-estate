"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function AdsCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="Ads campaign detail"
      description="Campaign planning detail. This does not publish to Google, Meta, or TikTok yet."
      path={`/ads/campaigns/${id}`}
      queryKey={`ads-campaign-${id}`}
      activityPath={`/operations/activities/ADS/AdsCampaign/${id}`}
      fields={[
        { name: "name", label: "Name" },
        { name: "provider", label: "Provider", type: "select", options: ["GOOGLE", "META", "TIKTOK", "OTHER"] },
        { name: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] },
        { name: "budgetAmount", label: "Budget", type: "number" },
        { name: "currency", label: "Currency" },
      ]}
    />
  );
}
