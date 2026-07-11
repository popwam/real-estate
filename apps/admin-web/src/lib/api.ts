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
} from "@/types/platform";

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

export class ApiError extends Error {
  status: number;
  details: unknown;
  requestId?: string;

  constructor(status: number, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.requestId = requestId;
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
    const refreshed = await refreshActiveSession();
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
    storeTokens(session, { persist: isActiveAccountPersisted() });
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
  return apiRequest<Organization[]>("/organizations");
}

export function createPlatformOrganizationApi(input: PlatformOrganizationInput) {
  return apiRequest<Organization>("/platform-admin/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
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
