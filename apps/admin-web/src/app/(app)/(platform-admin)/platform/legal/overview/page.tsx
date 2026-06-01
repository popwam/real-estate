"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function PlatformLegalOverviewPage() {
  return (
    <OperationsPage
      title="Legal overview"
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
