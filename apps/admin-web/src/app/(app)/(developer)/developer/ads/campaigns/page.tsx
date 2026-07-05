"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperAdsCampaignsPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.ads.campaigns.ac5049ea")}
      description="Campaign planning placeholder only. No provider APIs or publishing are connected."
      listPath="/ads/campaigns"
      queryKey="ads-campaigns"
      fields={[
        { name: "name", label: "Name" },
        { name: "provider", label: "Provider", type: "select", options: ["GOOGLE", "META", "TIKTOK", "OTHER"] },
        { name: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] },
        { name: "budgetAmount", label: "Budget", type: "number" },
        { name: "currency", label: "Currency" },
      ]}
      columns={["name", "provider", "status", "budgetAmount", "currency", "createdAt"]}
      detailBasePath="/developer/ads/campaigns"
      note="This does not publish to Google, Meta, or TikTok yet."
    />
  );
}
