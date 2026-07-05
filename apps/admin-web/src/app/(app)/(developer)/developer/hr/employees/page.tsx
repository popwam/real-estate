"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperHrEmployeesPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.hr.employees.058db91e")}
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
