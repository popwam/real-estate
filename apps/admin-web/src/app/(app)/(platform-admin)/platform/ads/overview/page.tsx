"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function PlatformAdsOverviewPage() {
  return (
    <OperationsPage
      title="Ads overview"
      description="Platform campaign planning placeholder."
      listPath="/ads/campaigns"
      queryKey="platform-ads-overview"
      fields={[
        { name: "name", label: "Name" },
        { name: "provider", label: "Provider", type: "select", options: ["GOOGLE", "META", "TIKTOK", "OTHER"] },
      ]}
      columns={["name", "organizationId", "provider", "status", "createdAt"]}
      note="This does not publish to Google, Meta, or TikTok yet."
    />
  );
}
