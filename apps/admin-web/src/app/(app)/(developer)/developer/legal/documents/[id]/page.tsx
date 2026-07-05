"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function LegalDocumentDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.legal.document.detail.9e17504d")}
      description="Legal document register detail. No e-signature or upload workflow is included."
      path={`/legal/documents/${id}`}
      queryKey={`legal-document-${id}`}
      activityPath={`/operations/activities/LEGAL/LegalDocument/${id}`}
      fields={[
        { name: "title", label: "Title" },
        { name: "type", label: "Type", type: "select", options: ["CONTRACT", "LICENSE", "AGREEMENT", "OTHER"] },
        { name: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "EXPIRED", "ARCHIVED"] },
        { name: "storageUrl", label: "Storage URL" },
      ]}
    />
  );
}
