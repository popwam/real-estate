"use client";

import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

export type TranslatedText = { en?: string; ar?: string; fr?: string };

export type HrJobOpening = {
  id: string;
  organizationId: string;
  title: string;
  localizedTitle?: TranslatedText | null;
  departmentId?: string | null;
  positionId?: string | null;
  branchId?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  description?: TranslatedText | null;
  requirements?: TranslatedText | null;
  status: "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";
  publicApplyEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { applicants: number };
};

export type HrApplicantDocument = {
  id: string;
  applicantId: string;
  organizationId: string;
  documentType: string;
  fileId?: string | null;
  status: string;
  extractionStatus: string;
  extractedData?: Record<string, unknown> | null;
  reviewerNotes?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type HrApplicant = {
  id: string;
  organizationId: string;
  jobOpeningId?: string | null;
  source: string;
  status: string;
  fullName: string;
  localizedName?: TranslatedText | null;
  email?: string | null;
  phoneCountry?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  nationalityCountryCode?: string | null;
  preferredLanguage?: string | null;
  address?: string | null;
  educationLevel?: string | null;
  university?: string | null;
  graduationYear?: number | null;
  currentJobTitle?: string | null;
  yearsOfExperience?: string | number | null;
  lastSalaryAmount?: string | number | null;
  lastSalaryCurrency?: string | null;
  expectedSalaryAmount?: string | number | null;
  expectedSalaryCurrency?: string | null;
  noticePeriod?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  notes?: string | null;
  aiReviewStatus: string;
  aiReviewSummary?: Record<string, unknown> | null;
  convertedEmployeeId?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  jobOpening?: HrJobOpening | null;
  documents?: HrApplicantDocument[];
  interviews?: Array<Record<string, unknown>>;
  offers?: Array<Record<string, unknown>>;
};

export type HrApplicantListResponse = {
  items: HrApplicant[];
  total: number;
  page: number;
  pageSize: number;
};

export type HrRecruitmentDashboard = {
  totalApplicants: number;
  pendingReview: number;
  documentsMissing: number;
  aiReviewNeeded: number;
  shortlisted: number;
  interviewsToday: number;
  offersPending: number;
  convertedThisMonth: number;
  rejected: number;
};

export type HrRecruitmentSettings = {
  id: string;
  organizationId: string;
  requiredCv: boolean;
  requiredGraduationCertificate: boolean;
  requiredNationalId: boolean;
  requiredMilitaryCertificate: boolean;
  requiredLastSalaryProof: boolean;
  requiredExperienceCertificates: boolean;
  countrySpecificRequirements?: Record<string, unknown> | null;
  jobSpecificOverrides?: Record<string, unknown> | null;
};

export function getRecruitmentDashboardApi(input?: { organizationId?: string }) {
  const query = queryString(input);
  return apiRequest<HrRecruitmentDashboard>(`/hr/recruitment${query}`);
}

export function listHrJobsApi(input?: Record<string, string | number | boolean | undefined>) {
  return apiRequest<HrJobOpening[]>(`/hr/recruitment/jobs${queryString(input)}`);
}

export function saveHrJobApi(input: Partial<HrJobOpening> & { organizationId?: string }) {
  return apiRequest<HrJobOpening>(input.id ? `/hr/recruitment/jobs/${encodeURIComponent(input.id)}` : "/hr/recruitment/jobs", {
    method: input.id ? "PATCH" : "POST",
    body: JSON.stringify(input),
  });
}

export function listHrApplicantsApi(input?: Record<string, string | number | boolean | undefined>) {
  return apiRequest<HrApplicantListResponse>(`/hr/recruitment/applicants${queryString(input)}`);
}

export function createHrApplicantApi(input: Record<string, unknown>) {
  return apiRequest<HrApplicant>("/hr/recruitment/applicants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getHrApplicantApi(id: string) {
  return apiRequest<HrApplicant>(`/hr/recruitment/applicants/${encodeURIComponent(id)}`);
}

export function updateHrApplicantApi(id: string, input: Record<string, unknown>) {
  return apiRequest<HrApplicant>(`/hr/recruitment/applicants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function uploadHrApplicantDocumentApi(input: {
  applicantId: string;
  documentType: string;
  file: File;
}) {
  const token = getAccessToken();
  if (!token) throw new Error("auth.required");
  const formData = new FormData();
  formData.set("documentType", input.documentType);
  formData.set("file", input.file);
  const response = await fetch(`${API_BASE_URL}/hr/recruitment/applicants/${encodeURIComponent(input.applicantId)}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body, "upload.failed"));
  return body as HrApplicantDocument;
}

export function extractHrApplicantDocumentApi(applicantId: string, documentId: string) {
  return apiRequest<HrApplicantDocument>(
    `/hr/recruitment/applicants/${encodeURIComponent(applicantId)}/documents/${encodeURIComponent(documentId)}/extract`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function reviewHrApplicantDocumentApi(applicantId: string, documentId: string, input: Record<string, unknown>) {
  return apiRequest<HrApplicantDocument>(
    `/hr/recruitment/applicants/${encodeURIComponent(applicantId)}/documents/${encodeURIComponent(documentId)}/review`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function createHrApplicantInterviewApi(applicantId: string, input: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>(`/hr/recruitment/applicants/${encodeURIComponent(applicantId)}/interviews`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createHrApplicantOfferApi(applicantId: string, input: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>(`/hr/recruitment/applicants/${encodeURIComponent(applicantId)}/offers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function convertHrApplicantApi(applicantId: string, input: Record<string, unknown>) {
  return apiRequest<{ applicantId: string; employee: { id: string; name: string }; defaultPassword?: string }>(
    `/hr/recruitment/applicants/${encodeURIComponent(applicantId)}/convert-to-employee`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function getHrRecruitmentSettingsApi(input?: { organizationId?: string }) {
  return apiRequest<HrRecruitmentSettings>(`/hr/recruitment/settings${queryString(input)}`);
}

export function updateHrRecruitmentSettingsApi(input: Partial<HrRecruitmentSettings> & { organizationId?: string }) {
  return apiRequest<HrRecruitmentSettings>("/hr/recruitment/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

function queryString(input?: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(input ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function errorMessage(body: unknown, fallback: string) {
  return body && typeof body === "object" && "message" in body ? String((body as { message: unknown }).message) : fallback;
}
