"use client";

import { apiRequest } from "@/lib/api";
import type {
  ExportResponse,
  ImportCommitResponse,
  ImportJob,
  ImportPreviewPayload,
  ImportPreviewResponse,
} from "@/types/admin-import-export";

export function previewProjectInventoryImportApi(input: ImportPreviewPayload) {
  return apiRequest<ImportPreviewResponse>("/import-export/project-inventory/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listImportJobsApi() {
  return apiRequest<ImportJob[]>("/import-export/jobs");
}

export function getImportJobApi(id: string) {
  return apiRequest<ImportJob>(`/import-export/jobs/${id}`);
}

export function commitImportJobApi(id: string) {
  return apiRequest<ImportCommitResponse>(`/import-export/jobs/${id}/commit`, { method: "POST" });
}

export function cancelImportJobApi(id: string) {
  return apiRequest<ImportJob>(`/import-export/jobs/${id}/cancel`, { method: "POST" });
}

export function exportProjectsApi() {
  return apiRequest<ExportResponse>("/import-export/export/projects");
}

export function exportInventoryApi() {
  return apiRequest<ExportResponse>("/import-export/export/inventory");
}

export function exportDealsApi() {
  return apiRequest<ExportResponse>("/import-export/export/deals");
}

export function exportCommissionsApi() {
  return apiRequest<ExportResponse>("/import-export/export/commissions");
}

export function exportAccountApi() {
  return apiRequest<ExportResponse>("/import-export/export/account");
}
