"use client";

import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

export type HrEmployeeUser = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  hasPassword?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  role?: {
    id: string;
    name: string;
    permissions?: Array<{ permission?: { key: string } }>;
  } | null;
};

export type HrEmployee = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  jobTitle?: string | null;
  employeeCode?: string | null;
  legalName?: string | null;
  displayName?: string | null;
  localizedNames?: Record<string, string> | null;
  photoFileId?: string | null;
  faceReferenceFileId?: string | null;
  faceVerificationConsent?: boolean;
  faceVerificationStatus?: string;
  maritalStatus?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationalityCountryCode?: string | null;
  residenceCountryCode?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  locale?: string | null;
  currency?: string | null;
  workStartDate?: string | null;
  hireDate?: string | null;
  isUnderProbation?: boolean;
  probationEndDate?: string | null;
  hasDisability?: boolean;
  disabilityStatus?: string | null;
  officeId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  jobLevelId?: string | null;
  employmentType?: string | null;
  contractType?: string | null;
  directManagerId?: string | null;
  secondaryManagerId?: string | null;
  workGroupId?: string | null;
  teamId?: string | null;
  workScheduleType?: string | null;
  workScheduleId?: string | null;
  shiftGroupId?: string | null;
  attendanceProfileId?: string | null;
  leaveProfileId?: string | null;
  breakProfileId?: string | null;
  allowedAttendanceLocationId?: string | null;
  exactRadiusMeters?: number | null;
  expandedRadiusMeters?: number | null;
  webCheckInAllowed?: boolean;
  mobileCheckInAllowed?: boolean;
  requireLivePhoto?: boolean;
  requireFaceVerification?: boolean;
  requireDvrReview?: boolean;
  webWifiPolicy?: string | null;
  remoteWorkAllowed?: boolean;
  holidayWorkPolicy?: string | null;
  salaryAmount?: string | number | null;
  salaryCurrency?: string | null;
  paymentFrequency?: string | null;
  paymentMethod?: string | null;
  payrollProfileId?: string | null;
  allowancesProfileId?: string | null;
  deductionsProfileId?: string | null;
  loginEnabled?: boolean;
  status: "ACTIVE" | "INACTIVE";
  todayAttendanceStatus?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
  department?: { id: string; name: string } | null;
  office?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
  workGroup?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  identifiers?: HrEmployeeIdentifier[];
  documents?: HrEmployeeDocument[];
  user?: HrEmployeeUser | null;
  organization?: {
    id: string;
    name: string;
    type: string;
    status: string;
  } | null;
  loginReadiness?: {
    canLogin: boolean;
    reasons: string[];
  };
};

export type HrEmployeeCreateResult = HrEmployee & {
  temporaryPassword?: string;
};

export type HrEmployeeIdentifier = {
  id?: string;
  type: string;
  countryCode?: string | null;
  value: string;
  expiresAt?: string | null;
  isPrimary?: boolean;
  verificationStatus?: string;
};

export type HrEmployeeDocument = {
  id: string;
  employeeId: string;
  documentType: string;
  fileId?: string | null;
  status: string;
  expiresAt?: string | null;
  aiReviewStatus?: string;
  manualReviewStatus?: string;
  employee?: HrEmployee;
};

export type HrEmployeeInput = {
  firstName?: string;
  lastName?: string;
  name?: string;
  allowLogin?: boolean;
  phone?: string;
  email?: string;
  jobTitle?: string;
  roleTitle?: string;
  departmentId?: string;
  role?: string;
  permissions?: string[];
  temporaryPassword?: string;
  status?: "ACTIVE" | "INACTIVE";
  organizationId?: string;
  phoneCountry?: string;
  [key: string]: unknown;
};

export type HrEmployeeListResponse = {
  items: HrEmployee[];
  total: number;
  page: number;
  pageSize: number;
};

export type HrEmployeeFilters = {
  organizationId?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | undefined;
};

export function listHrEmployeesApi(input?: HrEmployeeFilters) {
  const params = new URLSearchParams();
  Object.entries(input ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return apiRequest<HrEmployeeListResponse | HrEmployee[]>(`/hr/employees${query ? `?${query}` : ""}`).then((response) =>
    Array.isArray(response)
      ? { items: response, total: response.length, page: 1, pageSize: response.length || 10 }
      : response,
  );
}

export function getHrEmployeeApi(id: string) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}`);
}

export function createHrEmployeeApi(input: HrEmployeeInput) {
  return apiRequest<HrEmployeeCreateResult>("/hr/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateHrEmployeeApi(id: string, input: HrEmployeeInput) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function resetHrEmployeePasswordApi(id: string, temporaryPassword?: string) {
  return apiRequest<{ id: string; passwordReset: boolean; temporaryPassword?: string }>(
    `/hr/employees/${encodeURIComponent(id)}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify(temporaryPassword ? { temporaryPassword } : {}),
    },
  );
}

export function setHrEmployeeActiveApi(id: string, active: boolean) {
  return apiRequest<HrEmployee>(
    `/hr/employees/${encodeURIComponent(id)}/${active ? "activate" : "deactivate"}`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function updateHrEmployeeRoleApi(id: string, role: string) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateHrEmployeePermissionsApi(id: string, permissions: string[]) {
  return apiRequest<HrEmployee>(`/hr/employees/${encodeURIComponent(id)}/permissions`, {
    method: "PATCH",
    body: JSON.stringify({ permissions }),
  });
}

export type HrSummary = {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  presentToday: number;
  lateToday: number;
  pendingRequests: number;
  missingDocuments: number;
  expiredDocuments: number;
  newHiresThisMonth: number;
  employeesUnderProbation: number;
  employeesWithoutLoginAccess: number;
  employeesMissingFaceReferencePhoto: number;
  unavailableEngines?: string[];
};

export type HrWorkGroup = {
  id: string;
  organizationId: string;
  name: string;
  workScheduleId?: string | null;
  allowedAttendanceLocationId?: string | null;
  attendanceProfileId?: string | null;
  isActive: boolean;
  managers?: Array<{ user?: HrEmployeeUser | null }>;
  _count?: { employees: number };
};

export type HrTeam = {
  id: string;
  organizationId: string;
  name: string;
  workGroupId?: string | null;
  managerId?: string | null;
  isActive: boolean;
  workGroup?: HrWorkGroup | null;
  manager?: HrEmployeeUser | null;
  _count?: { employees: number };
};

export function getHrSummaryApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<HrSummary>(`/hr/summary${query ? `?${query}` : ""}`);
}

export function listHrWorkGroupsApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<HrWorkGroup[]>(`/hr/work-groups${query ? `?${query}` : ""}`);
}

export function saveHrWorkGroupApi(input: Partial<HrWorkGroup> & { managerIds?: string[] }) {
  return apiRequest<HrWorkGroup>(input.id ? `/hr/work-groups/${input.id}` : "/hr/work-groups", {
    method: input.id ? "PATCH" : "POST",
    body: JSON.stringify(input),
  });
}

export function listHrTeamsApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<HrTeam[]>(`/hr/teams${query ? `?${query}` : ""}`);
}

export function saveHrTeamApi(input: Partial<HrTeam>) {
  return apiRequest<HrTeam>(input.id ? `/hr/teams/${input.id}` : "/hr/teams", {
    method: input.id ? "PATCH" : "POST",
    body: JSON.stringify(input),
  });
}

export function listHrEmployeeDocumentsApi(input?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input ?? {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return apiRequest<HrEmployeeDocument[]>(`/hr/employee-documents${query ? `?${query}` : ""}`);
}

export function createHrEmployeeDocumentApi(input: Record<string, unknown>) {
  return apiRequest<HrEmployeeDocument>("/hr/employee-documents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function applyHrEmployeeActionApi(input: Record<string, unknown>) {
  return apiRequest<{ applied: boolean; status?: string; action: string; affectedEmployees: number }>("/hr/employee-actions/apply", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getHrOrgChartApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<Record<string, unknown>>(`/hr/org-chart${query ? `?${query}` : ""}`);
}

export type HrEmployeeImagePurpose = "profile_photo" | "face_reference";

export async function uploadHrEmployeeImageApi(input: {
  file: File;
  purpose: HrEmployeeImagePurpose;
  organizationId?: string;
}) {
  const token = getAccessToken();
  if (!token) throw new Error("auth.required");
  const formData = new FormData();
  formData.set("file", input.file);
  formData.set("purpose", input.purpose);
  if (input.organizationId) formData.set("organizationId", input.organizationId);
  const response = await fetch(`${API_BASE_URL}/files/hr-employee-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "upload.failed",
    );
  }
  return body as { fileId: string; purpose: HrEmployeeImagePurpose; mimeType: string; sizeBytes: number; createdAt: string };
}

export async function fetchHrEmployeeImageBlob(fileId: string, purpose: HrEmployeeImagePurpose) {
  const token = getAccessToken();
  if (!token) throw new Error("auth.required");
  const response = await fetch(
    `${API_BASE_URL}/files/${encodeURIComponent(fileId)}/hr-preview?purpose=${encodeURIComponent(purpose)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error("preview.failed");
  return response.blob();
}

export function listHrTransferLogApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<Array<Record<string, unknown>>>(`/hr/transfer-log${query ? `?${query}` : ""}`);
}

export function listHrTitleChangesApi(input?: { organizationId?: string }) {
  const params = new URLSearchParams();
  if (input?.organizationId) params.set("organizationId", input.organizationId);
  const query = params.toString();
  return apiRequest<Array<Record<string, unknown>>>(`/hr/title-changes${query ? `?${query}` : ""}`);
}

export function employeePermissionKeys(employee?: HrEmployee | null) {
  return (
    employee?.user?.role?.permissions
      ?.map((rolePermission) => rolePermission.permission?.key)
      .filter((key): key is string => Boolean(key)) ?? []
  );
}
