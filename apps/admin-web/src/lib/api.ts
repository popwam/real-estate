"use client";

import { getAccessToken } from "@/lib/auth";
import type { AuthSession, MeResponse } from "@/types/auth";
import type {
  Organization,
  OrganizationReview,
  ReviewActionInput,
  Verification,
} from "@/types/platform";

const API_BASE_URL =
  (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

type ApiOptions = RequestInit & {
  auth?: boolean;
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
  return path.split("?")[0] || "/";
}

export function loginApi(input: { email: string; password: string }) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
}

export function getCurrentUserApi() {
  return apiRequest<MeResponse>("/auth/me");
}

export function listOrganizationsApi() {
  return apiRequest<Organization[]>("/organizations");
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
