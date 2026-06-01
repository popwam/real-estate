"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function DeveloperHrDepartmentsPage() {
  return (
    <OperationsPage
      title="HR departments"
      description="Internal department registry foundation."
      listPath="/hr/departments"
      queryKey="hr-departments"
      fields={[{ name: "name", label: "Name" }]}
      columns={["name", "isActive", "createdAt"]}
      detailBasePath="/developer/hr/departments"
    />
  );
}
