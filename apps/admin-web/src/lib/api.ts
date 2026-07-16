"use client";

import { clearTokens, getAccessToken, getRefreshToken, isActiveAccountPersisted, storeTokens } from "@/lib/auth";
import type { AuthSession, MeResponse } from "@/types/auth";
import type {
  Organization,
  OrganizationReview,
  ReviewActionInput,
  Verification,
  PlatformOrganizationInput,
  OrganizationInvitation,
  OrganizationSubscription,
  OrganizationLimits,
  OrganizationOffice,
  OrganizationAttendanceLocation,
  OrganizationWifiRule,
  OrganizationDomainRecord,
  OrganizationPublicSiteSettings,
  OrganizationLegal,
  OrganizationOwner,
  OrganizationDocumentsResponse,
  OrganizationDocument,
  MetadataOption,
  DomainDiagnostics,
  ActivationCheck,
  CompanyRoleTemplate,
  PlatformPlan,
  PlatformSettingsSummary,
  RequiredDocumentPolicy,
} from "@/types/platform";
import type { OrganizationTypeOption } from "@/lib/organization-types";

const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

type ApiOptions = RequestInit & {
  auth?: boolean;
  authRetried?: boolean;
};

let refreshPromise: Promise<AuthSession | null> | null = null;

export class ApiError extends Error {
  status: number;
  details: unknown;
  requestId?: string;
  code?: string;
  requiredPermission?: string;

  constructor(status: number, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    if (details && typeof details === "object") {
      const body = details as { code?: unknown; requiredPermission?: unknown };
      this.code = typeof body.code === "string" ? body.code : undefined;
      this.requiredPermission =
        typeof body.requiredPermission === "string" ? body.requiredPermission : undefined;
    }
  }
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const requestId = headers.get("x-request-id") ?? createRequestId("admin-web");

  headers.set("Accept", "application/json");
  headers.set("x-request-id", requestId);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    logApiErrorDiagnostic({
      status: 0,
      method: options.method ?? "GET",
      path,
      requestId,
      message: "Network request failed",
    });
    throw new ApiError(
      0,
      "Network request failed",
      error instanceof Error ? { name: error.name } : undefined,
      requestId,
    );
  }

  if (response.status === 401 && options.auth !== false && path !== "/auth/refresh" && !options.authRetried) {
    const refreshed = await refreshActiveSessionOnce();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
      return apiRequest<T>(path, { ...options, headers: retryHeaders, authRetried: true });
    }
  }

  const responseRequestId = response.headers.get("x-request-id") ?? requestId;
  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : "Request failed";
    logApiErrorDiagnostic({
      status: response.status,
      method: options.method ?? "GET",
      path,
      requestId: responseRequestId,
      message,
    });
    throw new ApiError(response.status, message, body, responseRequestId);
  }

  return body as T;
}

function createRequestId(prefix: "admin-web") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);

  return `${prefix}-${timestamp}-${random}`;
}

function logApiErrorDiagnostic(input: {
  status: number;
  method: string;
  path: string;
  requestId: string;
  message: string;
}) {
  console.error("[api]", {
    status: input.status,
    method: input.method,
    path: sanitizeDiagnosticPath(input.path),
    requestId: input.requestId,
    message: input.message,
  });
}

function sanitizeDiagnosticPath(path: string) {
  const clean = path.split("?")[0] || "/";
  return clean.replace(/^\/invitations\/[^/]+/, "/invitations/:token");
}

export function getInvitationApi(token: string) {
  return apiRequest<{
    organization: { id: string; name: string; type: string };
    email: string;
    intendedRole: string;
    status: string;
    expiresAt: string;
    canAccept: boolean;
  }>(`/invitations/${encodeURIComponent(token)}`, { auth: false });
}

export function acceptInvitationApi(token: string, input: { password: string; firstName?: string; lastName?: string; phone?: string }) {
  return apiRequest<{ accepted: boolean; organization: Organization }>(`/invitations/${encodeURIComponent(token)}/accept`, {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
}

export function loginApi(input: { identifier?: string; email?: string; password: string; keepSignedIn?: boolean }) {
  const { identifier, email, password } = input;
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, email, password }),
    auth: false,
  });
}

export function getCurrentUserApi() {
  return apiRequest<MeResponse>("/auth/me");
}

function refreshActiveSessionOnce() {
  refreshPromise ??= refreshActiveSession().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function refreshActiveSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-request-id": createRequestId("admin-web"),
      },
      body: JSON.stringify({ refreshToken }),
    });
    const body = await parseResponse(response);
    if (!response.ok || !body || typeof body !== "object") {
      clearTokens();
      return null;
    }
    const session = body as AuthSession;
    storeTokens(session, {
      persist: isActiveAccountPersisted(),
      reason: "refresh",
    });
    return session;
  } catch {
    clearTokens();
    return null;
  }
}

export function changePasswordApi(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ passwordChanged: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listOrganizationsApi() {
  return apiRequest<Organization[]>("/platform/organizations");
}

export function createPlatformOrganizationApi(input: PlatformOrganizationInput) {
  return apiRequest<Organization>("/platform/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPlatformOrganizationApi(id: string) {
  return apiRequest<Organization>(`/platform/organizations/${id}`);
}

export function updatePlatformOrganizationApi(id: string, input: Partial<PlatformOrganizationInput>) {
  return apiRequest<Organization>(`/platform/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getOrganizationDeletionImpactApi(id: string) {
  return apiRequest<import("@/types/platform").OrganizationDeletionImpact>(`/platform/organizations/${encodeURIComponent(id)}/deletion-impact`);
}

export function archivePlatformOrganizationApi(id: string, reason?: string) {
  return apiRequest<Organization>(`/platform/organizations/${encodeURIComponent(id)}/archive`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function restorePlatformOrganizationApi(id: string) {
  return apiRequest<Organization>(`/platform/organizations/${encodeURIComponent(id)}/restore`, { method: "POST", body: JSON.stringify({}) });
}

export function suspendPlatformOrganizationApi(id: string, reason?: string) {
  return apiRequest<Organization>(`/platform/organizations/${encodeURIComponent(id)}/suspend`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function deleteDraftPlatformOrganizationApi(id: string, confirmationName: string) {
  return apiRequest<{ deleted: boolean; organizationId: string; removedCounts: Record<string, number> }>(`/platform/organizations/${encodeURIComponent(id)}/draft`, { method: "DELETE", body: JSON.stringify({ confirmationName }) });
}

export function getOrganizationActivationCheckApi(id: string) {
  return apiRequest<ActivationCheck>(`/platform/organizations/${id}/activation-check`);
}

export function activateOrganizationApi(id: string) {
  return apiRequest<ActivationCheck & { organization?: Organization }>(`/platform/organizations/${id}/activate`, {
    method: "POST",
  });
}

export function rejectProvisioningOrganizationApi(id: string, input: { reason: string; notes?: string }) {
  return apiRequest<Organization>(`/platform/organizations/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPlatformSettingsApi() {
  return apiRequest<PlatformSettingsSummary>("/platform/settings");
}

export function getPlatformDashboardApi() {
  return apiRequest<import("@/types/platform").PlatformDashboard>("/platform/dashboard");
}

export function getPlatformNavigationApi() {
  return apiRequest<import("@/types/platform").PlatformNavigationSection[]>("/platform/settings/navigation");
}

export function updatePlatformNavigationApi(sections: import("@/types/platform").PlatformNavigationSection[]) {
  return apiRequest<import("@/types/platform").PlatformNavigationSection[]>("/platform/settings/navigation", {
    method: "PATCH",
    body: JSON.stringify({ sections }),
  });
}

export function restorePlatformNavigationApi() {
  return apiRequest<import("@/types/platform").PlatformNavigationSection[]>("/platform/settings/navigation/restore-defaults", { method: "POST" });
}

export function listPlatformMetadataApi(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiRequest<import("@/types/platform").PlatformMetadataRecord[]>(`/platform/settings/metadata${query}`);
}

export function createPlatformMetadataApi(input: Partial<import("@/types/platform").PlatformMetadataRecord>) {
  return apiRequest<import("@/types/platform").PlatformMetadataRecord>("/platform/settings/metadata", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlatformMetadataApi(id: string, input: Partial<import("@/types/platform").PlatformMetadataRecord>) {
  return apiRequest<import("@/types/platform").PlatformMetadataRecord>(`/platform/settings/metadata/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listPlatformPlansApi() {
  return apiRequest<PlatformPlan[]>("/platform/settings/plans");
}

export function createPlatformPlanApi(input: Partial<PlatformPlan>) {
  return apiRequest<PlatformPlan>("/platform/settings/plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePlatformPlanApi(id: string, input: Partial<PlatformPlan>) {
  return apiRequest<PlatformPlan>(`/platform/settings/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listPlatformSubscriptionsApi() {
  return apiRequest<Array<OrganizationSubscription & { organization?: Pick<Organization, "id" | "name" | "slug" | "type" | "status"> }>>("/platform/settings/subscriptions");
}

export function listRequiredDocumentPoliciesApi() {
  return apiRequest<RequiredDocumentPolicy[]>("/platform/settings/verification-policies");
}

export function createRequiredDocumentPolicyApi(input: Partial<RequiredDocumentPolicy>) {
  return apiRequest<RequiredDocumentPolicy>("/platform/settings/verification-policies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRequiredDocumentPolicyApi(id: string, input: Partial<RequiredDocumentPolicy>) {
  return apiRequest<RequiredDocumentPolicy>(`/platform/settings/verification-policies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getPlatformModulesApi() {
  return apiRequest<string[]>("/platform/settings/modules");
}

export function getPlatformDomainSettingsApi() {
  return apiRequest<PlatformSettingsSummary["domains"]>("/platform/settings/domains");
}

export function getPlatformOrganizationSubscriptionApi(id: string) {
  return apiRequest<OrganizationSubscription | null>(`/platform/organizations/${id}/subscription`);
}

export function updatePlatformOrganizationSubscriptionApi(id: string, input: Partial<OrganizationSubscription>) {
  return apiRequest<OrganizationSubscription>(`/platform/organizations/${id}/subscription`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getPlatformOrganizationLimitsApi(id: string) {
  return apiRequest<OrganizationLimits | null>(`/platform/organizations/${id}/limits`);
}

export function updatePlatformOrganizationLimitsApi(id: string, input: Partial<OrganizationLimits>) {
  return apiRequest<OrganizationLimits>(`/platform/organizations/${id}/limits`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationOfficesApi(id: string) {
  return apiRequest<OrganizationOffice[]>(`/organizations/${id}/offices`);
}

export function createOrganizationOfficeApi(id: string, input: Partial<OrganizationOffice>) {
  return apiRequest<OrganizationOffice>(`/organizations/${id}/offices`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationOfficeApi(id: string, officeId: string, input: Partial<OrganizationOffice>) {
  return apiRequest<OrganizationOffice>(`/organizations/${id}/offices/${officeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationAttendanceLocationsApi(id: string) {
  return apiRequest<OrganizationAttendanceLocation[]>(`/organizations/${id}/attendance-locations`);
}

export function createOrganizationAttendanceLocationApi(id: string, input: Partial<OrganizationAttendanceLocation>) {
  return apiRequest<OrganizationAttendanceLocation>(`/organizations/${id}/attendance-locations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationAttendanceLocationApi(id: string, locationId: string, input: Partial<OrganizationAttendanceLocation>) {
  return apiRequest<OrganizationAttendanceLocation>(`/organizations/${id}/attendance-locations/${locationId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationWifiRulesApi(id: string) {
  return apiRequest<OrganizationWifiRule[]>(`/organizations/${id}/wifi-rules`);
}

export function createOrganizationWifiRuleApi(id: string, input: Partial<OrganizationWifiRule>) {
  return apiRequest<OrganizationWifiRule>(`/organizations/${id}/wifi-rules`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationWifiRuleApi(id: string, ruleId: string, input: Partial<OrganizationWifiRule>) {
  return apiRequest<OrganizationWifiRule>(`/organizations/${id}/wifi-rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationProvisioningDomainsApi(id: string) {
  return apiRequest<OrganizationDomainRecord[]>(`/organizations/${id}/domains`);
}

export function createOrganizationProvisioningDomainApi(id: string, input: Partial<OrganizationDomainRecord>) {
  return apiRequest<OrganizationDomainRecord>(`/organizations/${id}/domains`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationProvisioningDomainApi(id: string, domainId: string, input: Partial<OrganizationDomainRecord>) {
  return apiRequest<OrganizationDomainRecord>(`/organizations/${id}/domains/${domainId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function setDefaultOrganizationProvisioningDomainApi(id: string, domainId: string) {
  return apiRequest<OrganizationDomainRecord>(`/organizations/${id}/domains/${domainId}/set-default`, { method: "POST" });
}

export function getOrganizationPublicSiteApi(id: string) {
  return apiRequest<OrganizationPublicSiteSettings>(`/organizations/${id}/public-site`);
}

export function updateOrganizationPublicSiteApi(id: string, input: Partial<OrganizationPublicSiteSettings>) {
  return apiRequest<OrganizationPublicSiteSettings>(`/organizations/${id}/public-site`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getOrganizationDomainDiagnosticsApi(id: string) {
  return apiRequest<DomainDiagnostics>(`/organizations/${id}/domain-diagnostics`);
}

export function getOrganizationLegalApi(id: string) {
  return apiRequest<OrganizationLegal>(`/organizations/${id}/legal`);
}

export function updateOrganizationLegalApi(id: string, input: Partial<OrganizationLegal>) {
  return apiRequest<OrganizationLegal>(`/organizations/${id}/legal`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationOwnersApi(id: string) {
  return apiRequest<OrganizationOwner[]>(`/organizations/${id}/owners`);
}

export function createOrganizationOwnerApi(id: string, input: Partial<OrganizationOwner>) {
  return apiRequest<OrganizationOwner>(`/organizations/${id}/owners`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationOwnerApi(id: string, ownerId: string, input: Partial<OrganizationOwner>) {
  return apiRequest<OrganizationOwner>(`/organizations/${id}/owners/${ownerId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationDocumentsApi(id: string) {
  return apiRequest<OrganizationDocumentsResponse>(`/organizations/${id}/documents`);
}

export function createOrganizationDocumentApi(id: string, input: Partial<OrganizationDocument>) {
  return apiRequest<OrganizationDocument>(`/organizations/${id}/documents`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationDocumentApi(id: string, documentId: string, input: Partial<OrganizationDocument>) {
  return apiRequest<OrganizationDocument>(`/organizations/${id}/documents/${documentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function extractOrganizationDocumentApi(id: string, documentId: string) {
  return apiRequest<OrganizationDocument>(`/organizations/${id}/documents/${documentId}/extract`, { method: "POST" });
}

export function reviewOrganizationDocumentApi(id: string, documentId: string, input: { status?: string; note?: string }) {
  return apiRequest<OrganizationDocument>(`/organizations/${id}/documents/${documentId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadOrganizationDocumentApi(id: string, file: File) {
  const token = getAccessToken();
  if (!token) throw new ApiError(401, "Authentication is required.");
  const formData = new FormData();
  formData.set("organizationId", id);
  formData.set("file", file);
  const response = await fetch(`${API_BASE_URL}/files/organization-document`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const body = await parseResponse(response);
  if (!response.ok) {
    const message = typeof body === "object" && body && "message" in body
      ? String((body as { message: unknown }).message)
      : "Document upload failed.";
    throw new ApiError(response.status, message, body, response.headers.get("x-request-id") ?? undefined);
  }
  return body as { fileId: string; mimeType: string; sizeBytes: number; createdAt: string };
}

export function reviewOrganizationDocumentFieldsApi(
  id: string,
  documentId: string,
  input: { fields: string[]; action: "APPLY" | "REJECT"; confirmSensitive?: boolean },
) {
  return apiRequest<{ action: string; appliedFields: string[]; rejectedFields: string[]; documentStatus: string }>(
    `/organizations/${id}/documents/${documentId}/fields/review`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function listCompanyRoleTemplatesApi(id: string) {
  return apiRequest<CompanyRoleTemplate[]>(`/organizations/${id}/access-levels`);
}

export function createCompanyRoleTemplateApi(id: string, input: Partial<CompanyRoleTemplate>) {
  return apiRequest<CompanyRoleTemplate>(`/organizations/${id}/access-levels`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCompanyRoleTemplateApi(id: string, templateId: string, input: Partial<CompanyRoleTemplate>) {
  return apiRequest<CompanyRoleTemplate>(`/organizations/${id}/access-levels/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getMetadataCountriesApi() {
  return apiRequest<MetadataOption[]>("/metadata/countries");
}

export function getMetadataCurrenciesApi() {
  return apiRequest<MetadataOption[]>("/metadata/currencies");
}

export function getMetadataLanguagesApi() {
  return apiRequest<MetadataOption[]>("/metadata/languages");
}

export function getMetadataTimezonesApi() {
  return apiRequest<MetadataOption[]>("/metadata/timezones");
}

export function getMetadataOrganizationTypesApi() {
  return apiRequest<OrganizationTypeOption[]>("/metadata/organization-types");
}

export function listOrganizationInvitationsApi(id: string) {
  return apiRequest<OrganizationInvitation[]>(`/platform-admin/organizations/${id}/invitations`);
}

export function createOrganizationInvitationApi(
  id: string,
  input: { email: string; intendedRole: string; expiresInHours?: number },
) {
  return apiRequest<OrganizationInvitation>(`/platform-admin/organizations/${id}/invitations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getOrganizationReviewApi(id: string) {
  return apiRequest<OrganizationReview>(`/platform-admin/organizations/${id}/review`);
}

export function getVerificationQueueApi() {
  return apiRequest<Verification[]>("/platform-admin/verification-queue");
}

export function getVerificationApi(id: string) {
  return apiRequest<Verification>(`/organization-verifications/${id}`);
}

export function approveOrganizationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Organization>(`/platform-admin/organizations/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function rejectOrganizationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Organization>(`/platform-admin/organizations/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function suspendOrganizationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Organization>(`/platform-admin/organizations/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function reactivateOrganizationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Organization>(`/platform-admin/organizations/${id}/reactivate`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function approveVerificationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Verification>(`/organization-verifications/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function rejectVerificationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Verification>(`/organization-verifications/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function requestMoreVerificationApi(id: string, input: ReviewActionInput) {
  return apiRequest<Verification>(`/organization-verifications/${id}/request-more`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
