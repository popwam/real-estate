"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export function TeamAttendanceSection({ queryKey, detailBasePath }: { queryKey: string; detailBasePath?: string }) {
  const { t } = useI18n();
  return <OperationsPage
    showHeader={false}
    title={t("adminSweep.hr.attendance.c2fcb0b7")}
    description={t("attendance.admin.description")}
    listPath="/hr/attendance"
    queryKey={queryKey}
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
      { name: "employee", label: t("attendance.admin.employee"), render: (row) => employeeName(row) },
      { name: "date", label: t("attendance.admin.date"), render: (row) => formatDate(row.date) },
      { name: "checkInAt", label: t("attendance.admin.checkInAt"), render: (row) => formatDateTime(row.checkInAt) },
      { name: "checkOutAt", label: t("attendance.admin.checkOutAt"), render: (row) => formatDateTime(row.checkOutAt) },
      { name: "status", label: t("attendance.admin.status") },
      { name: "verificationStatus", label: t("attendance.admin.verificationStatus") },
      { name: "faceVerificationStatus", label: t("attendance.admin.faceStatus") },
      { name: "referenceImageId", label: t("attendance.admin.referenceImage") },
      { name: "capturedImageId", label: t("attendance.admin.capturedImage") },
      { name: "verificationFailureReasons", label: t("attendance.admin.failureReasons"), render: (row) => formatReasons(row.verificationFailureReasons) },
      { name: "dvrVerificationStatus", label: t("attendance.admin.dvrStatus") },
      { name: "attendanceSource", label: t("attendance.admin.source") },
    ]}
    detailBasePath={detailBasePath}
  />;
}

function formatReasons(value: unknown) { return Array.isArray(value) && value.length ? value.map(String).join(", ") : "-"; }
function employeeName(row: Record<string, unknown>) { const employee = row.employee; if (employee && typeof employee === "object" && "name" in employee) { const name = (employee as { name?: unknown }).name; if (typeof name === "string" && name.trim()) return name; } return String(row.employeeId ?? "-"); }
function formatDate(value: unknown) { if (!value) return "-"; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(); }
function formatDateTime(value: unknown) { if (!value) return "-"; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(); }
