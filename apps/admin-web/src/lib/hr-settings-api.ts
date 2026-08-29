"use client";

import { apiRequest } from "@/lib/api";

export type OrganizationBranch = {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  exactRadiusMeters: number;
  expandedRadiusMeters: number;
  isActive: boolean;
};

export type CompanyAccessLevel = {
  id: string;
  code: string;
  displayName: string;
  description?: string | null;
  permissions: string[];
  isActive: boolean;
  sortOrder: number;
};

export type AttendanceSettings = {
  requireLocation: boolean;
  allowedLatitude?: number | null;
  allowedLongitude?: number | null;
  allowedRadiusMeters?: number | null;
  exactRadiusMeters: number;
  expandedRadiusMeters: number;
  gracePeriodMinutes: number;
  firstLateSliceMinutes: number;
  firstLatePenaltyType: string;
  firstLatePenaltyValue?: string | null;
  secondLateSliceMinutes: number;
  secondLatePenaltyType: string;
  secondLatePenaltyValue?: string | null;
  beyondSecondSlicePenaltyType: string;
  requireWifi: boolean;
  allowedWifiSsids: string[];
  allowedWifiBssids: string[];
  requirePhoto: boolean;
  maxGpsAccuracyMeters?: number | null;
  firstAttendancePhotoRequiresApproval: boolean;
  requireFaceVerification: boolean;
  requireDvrReview: boolean;
  allowWebCheckIn: boolean;
  allowMobileCheckIn: boolean;
  allowExpandedRadiusWithReview: boolean;
  webWifiPolicy: "BLOCK" | "MANUAL_REVIEW" | "IGNORE_FOR_WEB";
  workStartTime: string;
  workEndTime: string;
  monthlyLateAllowanceHours: number;
  lateAllowanceChargeHoursPerDay: number;
  missingAttendanceDisposition: "ABSENT" | "LEAVE";
  autoCloseOpenAttendance: boolean;
  regularShiftAutoCloseMode: "END_OF_WORK_DAY" | "PLANNED_CHECK_OUT_PLUS_GRACE";
  autoCloseGraceMinutes: number;
  autoCloseAtLocalMidnight: boolean;
  checkOutOutsideLocationPolicy:
    | "BLOCK"
    | "MANUAL_REVIEW"
    | "ALLOW_WITH_EVIDENCE";
};

export function exportAttendanceCsvApi(date: string) {
  const { dateFrom, dateTo } = monthRange(date);
  const query = new URLSearchParams({ dateFrom, dateTo, format: "csv" });
  return apiRequest<string>(`/hr/export/attendance?${query.toString()}`);
}

function monthRange(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("date must be YYYY-MM-DD");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error("date must be a valid calendar date");
  }
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  return {
    dateFrom: `${prefix}-01`,
    dateTo: `${prefix}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Deliberately limited projection returned to an employee's self-service UI. */
export type SelfAttendancePolicy = {
  allowWebCheckIn: boolean;
  allowMobileCheckIn: boolean;
  requireLocation: boolean;
  requirePhoto: boolean;
  requireWifi: boolean;
  webWifiPolicy: "BLOCK" | "MANUAL_REVIEW" | "IGNORE_FOR_WEB";
  locationAccuracyThresholdMeters: number | null;
  locationFreshnessSeconds: number | null;
  canCheckIn: boolean;
  blockingReasons: string[];
};

export type HrAttendanceScheduleOption = {
  id: string;
  name: string;
  timezone?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
};

export function listBranchesApi(organizationId?: string) {
  const query = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : "";
  return apiRequest<OrganizationBranch[]>(`/hr/branches${query}`);
}

export function saveBranchApi(input: Partial<OrganizationBranch>) {
  return apiRequest<OrganizationBranch>("/hr/branches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function setBranchActiveApi(id: string, active: boolean) {
  return apiRequest<OrganizationBranch>(
    `/hr/branches/${id}/${active ? "activate" : "deactivate"}`,
    {
      method: "PATCH",
    },
  );
}

export function listCompanyAccessLevelsApi() {
  return apiRequest<CompanyAccessLevel[]>("/company/access-levels");
}

export function createCompanyAccessLevelApi(
  input: Partial<CompanyAccessLevel>,
) {
  return apiRequest<CompanyAccessLevel>("/company/access-levels", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAttendanceSettingsApi() {
  return apiRequest<AttendanceSettings>("/hr/attendance/settings");
}

export function getMyAttendancePolicyApi() {
  return apiRequest<SelfAttendancePolicy>("/hr/attendance/me/policy", {
    refreshOnUnauthorized: false,
  });
}

export function listAttendanceSchedulesApi() {
  return apiRequest<HrAttendanceScheduleOption[]>("/hr/attendance/schedules");
}

export function updateAttendanceSettingsApi(
  input: Partial<AttendanceSettings>,
) {
  return apiRequest<AttendanceSettings>("/hr/attendance/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export type SelfAttendance = {
  id: string | null;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: string | null;
  verificationStatus: string | null;
  verificationFailureReasons: string[];
  referenceImageId?: string | null;
  capturedImageId?: string | null;
  faceVerificationStatus?: string | null;
  faceVerificationConfidence?: number | null;
  minutesLate?: number | null;
  lateLevel?: string | null;
  penaltyType?: string | null;
  penaltyValue?: string | null;
  requiresReview?: boolean;
  requiresManualReview?: boolean;
  reviewReason?: string | null;
  checkOutMethod?: "SELF_SERVICE" | "ADMIN_MANUAL" | "AUTO_CLOSE" | null;
  checkOutVerificationStatus?:
    | "VERIFIED"
    | "PENDING_REVIEW"
    | "NOT_VERIFIED"
    | "AUTO_CLOSED"
    | null;
  autoClosed?: boolean;
  autoClosedAt?: string | null;
  autoCloseReason?: string | null;
  plannedCheckOutAt?: string | null;
  calculatedWorkMinutes?: number | null;
  approvedWorkMinutes?: number | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
};

export type AttendanceCheckInPreflight = {
  allowed: boolean;
  insideAllowedRadius: boolean;
  distanceMeters: number | null;
  allowedRadiusMeters: number | null;
  exactRadiusMeters: number | null;
  expandedRadiusMeters: number | null;
  matchedLocationId: string | null;
  matchedLocationName: string | null;
  source: string | null;
  accuracyMeters: number | null;
  accuracyAccepted: boolean;
  mode: string;
  blockingReasons: string[];
  requiresPhoto: boolean;
  requiresWifi: boolean;
};

export type AttendanceEvidencePhoto = {
  fileId: string;
  purpose: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type WebAttendanceLocation = {
  id: string;
  organizationId: string;
  branchId: string;
  branchName: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  exactRadiusMeters: number;
  expandedRadiusMeters: number;
  isActive: boolean;
  allowedForWeb: boolean;
};

export function getMyAttendanceTodayApi() {
  return apiRequest<SelfAttendance>("/hr/attendance/me/today");
}

export function getMyAttendanceHistoryApi() {
  return apiRequest<SelfAttendance[]>("/hr/attendance/me/history");
}

export function getMyWebAttendanceLocationsApi() {
  return apiRequest<WebAttendanceLocation[]>("/hr/attendance/me/locations");
}

export function preflightCheckInApi(input: Record<string, unknown>) {
  return apiRequest<AttendanceCheckInPreflight>(
    "/hr/attendance/check-in/preflight",
    {
      method: "POST",
      body: JSON.stringify({ ...input, clientPlatform: "WEB" }),
    },
  );
}

export function preflightCheckOutApi(input: Record<string, unknown>) {
  return apiRequest<AttendanceCheckInPreflight>(
    "/hr/attendance/check-out/preflight",
    {
      method: "POST",
      body: JSON.stringify({ ...input, clientPlatform: "WEB" }),
    },
  );
}

export function uploadAttendanceEvidencePhotoApi(
  file: File,
  purpose: "CHECK_IN" | "CHECK_OUT" = "CHECK_IN",
) {
  const body = new FormData();
  body.set("file", file);
  body.set("purpose", purpose);
  return apiRequest<AttendanceEvidencePhoto>("/hr/attendance/evidence-photo", {
    method: "POST",
    body,
  });
}

export function checkInApi(input: Record<string, unknown>) {
  return apiRequest<SelfAttendance>("/hr/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ ...input, clientPlatform: "WEB" }),
  });
}

export function checkOutApi(input: Record<string, unknown>) {
  return apiRequest<SelfAttendance>("/hr/attendance/check-out", {
    method: "POST",
    body: JSON.stringify({ ...input, clientPlatform: "WEB" }),
  });
}
