"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelImportJobApi,
  commitImportJobApi,
  exportAccountApi,
  exportCommissionsApi,
  exportDealsApi,
  exportInventoryApi,
  exportProjectsApi,
  getImportJobApi,
  listImportJobsApi,
  previewProjectInventoryImportApi,
} from "@/lib/admin-import-export-api";
import type { ImportPreviewPayload } from "@/types/admin-import-export";

const importJobsKey = ["admin-import-export", "jobs"] as const;

export function useImportJobs() {
  return useQuery({ queryKey: importJobsKey, queryFn: listImportJobsApi });
}

export function useImportJob(id: string) {
  return useQuery({
    queryKey: [...importJobsKey, id],
    queryFn: () => getImportJobApi(id),
    enabled: Boolean(id),
  });
}

export function usePreviewProjectInventoryImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportPreviewPayload) => previewProjectInventoryImportApi(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: importJobsKey }),
  });
}

export function useCommitImportJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commitImportJobApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: importJobsKey });
      void qc.invalidateQueries({ queryKey: [...importJobsKey, id] });
    },
  });
}

export function useCancelImportJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelImportJobApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: importJobsKey });
      void qc.invalidateQueries({ queryKey: [...importJobsKey, id] });
    },
  });
}

export function useExportProjects() {
  return useMutation({ mutationFn: exportProjectsApi });
}

export function useExportInventory() {
  return useMutation({ mutationFn: exportInventoryApi });
}

export function useExportDeals() {
  return useMutation({ mutationFn: exportDealsApi });
}

export function useExportCommissions() {
  return useMutation({ mutationFn: exportCommissionsApi });
}

export function useExportAccount() {
  return useMutation({ mutationFn: exportAccountApi });
}
