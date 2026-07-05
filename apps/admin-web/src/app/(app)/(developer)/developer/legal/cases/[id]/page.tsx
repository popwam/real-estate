"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function LegalCaseDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.legal.case.detail.711e6dca")}
      description="Legal case tracker detail."
      path={`/legal/cases/${id}`}
      queryKey={`legal-case-${id}`}
      activityPath={`/operations/activities/LEGAL/LegalCase/${id}`}
      fields={[
        { name: "title", label: "Title" },
        { name: "status", label: "Status", type: "select", options: ["OPEN", "CLOSED", "ON_HOLD"] },
        { name: "description", label: "Description" },
      ]}
    />
  );
}
