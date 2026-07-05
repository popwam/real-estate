"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperLegalCasesPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.legal.cases.a6f95b14")}
      description="Basic legal case tracker foundation."
      listPath="/legal/cases"
      queryKey="legal-cases"
      fields={[
        { name: "title", label: "Title" },
        { name: "status", label: "Status", type: "select", options: ["OPEN", "CLOSED", "ON_HOLD"] },
        { name: "description", label: "Description" },
      ]}
      columns={["title", "status", "description", "createdAt"]}
      detailBasePath="/developer/legal/cases"
    />
  );
}
