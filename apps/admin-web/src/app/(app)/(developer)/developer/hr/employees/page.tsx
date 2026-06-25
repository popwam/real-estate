"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function DeveloperHrEmployeesPage() {
  return (
    <OperationsPage
      title="HR employees"
      description="Employee records for team operations. No payroll is included."
      listPath="/hr/employees"
      queryKey="hr-employees"
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        { name: "roleTitle", label: "Role title" },
        { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"] },
      ]}
      columns={["name", "email", "phone", "roleTitle", "status", "createdAt"]}
      detailBasePath="/developer/hr/employees"
    />
  );
}
