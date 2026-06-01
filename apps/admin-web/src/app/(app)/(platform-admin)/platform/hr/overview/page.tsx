"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function PlatformHrOverviewPage() {
  return (
    <OperationsPage
      title="HR overview"
      description="Platform view of HR department foundations."
      listPath="/hr/departments"
      queryKey="platform-hr-overview"
      fields={[{ name: "name", label: "Name" }]}
      columns={["name", "organizationId", "isActive", "createdAt"]}
      note="This foundation view lists departments only. Payroll is intentionally out of scope."
    />
  );
}
