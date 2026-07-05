"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function PlatformAdsOverviewPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.ads.overview.dfb12197")}
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
