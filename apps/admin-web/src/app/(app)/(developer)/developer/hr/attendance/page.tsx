"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function DeveloperHrAttendancePage() {
  return (
    <OperationsPage
      title="HR attendance"
      description="Basic attendance records. No payroll automation is included."
      listPath="/hr/attendance"
      queryKey="hr-attendance"
      fields={[
        { name: "employeeId", label: "Employee id" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["PRESENT", "ABSENT", "LATE", "OFF"] },
        { name: "note", label: "Note" },
      ]}
      columns={["employeeId", "date", "status", "note"]}
      detailBasePath="/developer/hr/attendance"
    />
  );
}
