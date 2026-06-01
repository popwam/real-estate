"use client";

import { apiRequest } from "@/lib/api";

export type OperationRecord = Record<string, unknown>;

export function listOperationApi(path: string) {
  return apiRequest<OperationRecord[]>(path);
}

export function getOperationApi(path: string) {
  return apiRequest<OperationRecord>(path);
}

export function getOperationSummaryApi(path: string) {
  return apiRequest<OperationRecord>(path);
}

export type OperationActivity = {
  id: string;
  module: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actorUser?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
};

export type OperationActivitiesResponse = {
  items: OperationActivity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function listOperationActivitiesApi(path: string) {
  return apiRequest<OperationActivitiesResponse>(path);
}

export function createOperationApi(path: string, input: OperationRecord) {
  return apiRequest<OperationRecord>(path, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function patchOperationApi(path: string, input: OperationRecord = {}) {
  return apiRequest<OperationRecord>(path, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
