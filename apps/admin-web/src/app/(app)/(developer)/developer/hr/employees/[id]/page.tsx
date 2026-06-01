"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function HrEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="HR employee detail"
      description="Safe employee record detail. Payroll is not included."
      path={`/hr/employees/${id}`}
      queryKey={`hr-employee-${id}`}
      activityPath={`/operations/activities/HR/HrEmployee/${id}`}
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        { name: "roleTitle", label: "Role title" },
        { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"] },
      ]}
    />
  );
}
