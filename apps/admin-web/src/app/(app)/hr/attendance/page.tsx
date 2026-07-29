"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function HrAttendancePage() {
  const { t } = useI18n();
  return <OperationsPage
    title={t("adminSweep.hr.attendance.c2fcb0b7")}
    description={t("attendance.admin.description")}
    listPath="/hr/attendance"
    queryKey="global-hr-attendance"
    fields={[
      { name: "employeeId", label: t("attendance.admin.employeeId") },
      { name: "date", label: t("attendance.admin.date"), type: "date" },
      { name: "checkInAt", label: t("attendance.admin.checkInAt"), type: "datetime-local" },
      { name: "checkOutAt", label: t("attendance.admin.checkOutAt"), type: "datetime-local" },
      { name: "status", label: t("attendance.admin.status"), type: "select", options: ["PRESENT", "ABSENT", "LATE", "OFF"] },
      { name: "verificationStatus", label: t("attendance.admin.verificationStatus"), type: "select", options: ["VERIFIED", "PENDING_REVIEW", "REJECTED", "FAILED"] },
      { name: "faceVerificationStatus", label: t("attendance.admin.faceStatus"), type: "select", options: ["NOT_REQUIRED", "PENDING", "MATCHED", "NOT_MATCHED", "MANUAL_REVIEW_REQUIRED", "APPROVED_MANUALLY", "REJECTED"] },
      { name: "faceVerificationConfidence", label: t("attendance.admin.faceConfidence"), type: "number" },
      { name: "dvrVerificationStatus", label: t("attendance.admin.dvrStatus"), type: "select", options: ["NOT_REQUIRED", "PENDING", "MATCHED", "NOT_MATCHED", "MANUAL_REVIEW", "UNAVAILABLE"] },
      { name: "dvrReferenceId", label: t("attendance.admin.dvrReference") },
      { name: "note", label: t("attendance.admin.note") },
    ]}
    columns={[
      { name: "employeeId", label: t("attendance.admin.employee") },
      { name: "date", label: t("attendance.admin.date") },
      { name: "checkInAt", label: t("attendance.admin.checkInAt") },
      { name: "checkOutAt", label: t("attendance.admin.checkOutAt") },
      { name: "status", label: t("attendance.admin.status") },
      { name: "verificationStatus", label: t("attendance.admin.verificationStatus") },
      { name: "faceVerificationStatus", label: t("attendance.admin.faceStatus") },
      { name: "referenceImageId", label: t("attendance.admin.referenceImage") },
      { name: "capturedImageId", label: t("attendance.admin.capturedImage") },
      { name: "dvrVerificationStatus", label: t("attendance.admin.dvrStatus") },
      { name: "attendanceSource", label: t("attendance.admin.source") },
    ]}
  />;
}
