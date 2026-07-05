"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperLegalDocumentsPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.legal.documents.1a83177c")}
      description="Document register foundation. No e-signature or storage workflow is included."
      listPath="/legal/documents"
      queryKey="legal-documents"
      fields={[
        { name: "title", label: "Title" },
        { name: "type", label: "Type", type: "select", options: ["CONTRACT", "LICENSE", "AGREEMENT", "OTHER"] },
        { name: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "EXPIRED", "ARCHIVED"] },
        { name: "storageUrl", label: "Storage URL" },
      ]}
      columns={["title", "type", "status", "storageUrl", "createdAt"]}
      detailBasePath="/developer/legal/documents"
    />
  );
}
