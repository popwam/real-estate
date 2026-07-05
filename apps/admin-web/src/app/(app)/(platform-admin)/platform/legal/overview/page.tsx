"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function PlatformLegalOverviewPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.legal.overview.530e5a6a")}
      description="Platform-scoped legal document foundation."
      listPath="/legal/documents"
      queryKey="platform-legal-overview"
      fields={[
        { name: "title", label: "Title" },
        { name: "type", label: "Type", type: "select", options: ["CONTRACT", "LICENSE", "AGREEMENT", "OTHER"] },
      ]}
      columns={["title", "organizationId", "type", "status", "createdAt"]}
    />
  );
}
