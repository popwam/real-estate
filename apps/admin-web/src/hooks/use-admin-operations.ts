"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOperationApi,
  getOperationApi,
  getOperationSummaryApi,
  listOperationActivitiesApi,
  listOperationApi,
  patchOperationApi,
  type OperationRecord,
} from "@/lib/admin-operations-api";

export function useOperationList(key: string, path: string) {
  return useQuery({
    queryKey: ["operations", key, path],
    queryFn: () => listOperationApi(path),
  });
}

export function useOperationDetail(key: string, path: string) {
  return useQuery({
    queryKey: ["operations", key, path],
    queryFn: () => getOperationApi(path),
  });
}

export function useOperationSummary(key: string, path: string) {
  return useQuery({
    queryKey: ["operations-summary", key, path],
    queryFn: () => getOperationSummaryApi(path),
  });
}

export function useOperationActivities(key: string, path: string) {
  return useQuery({
    queryKey: ["operations-activities", key, path],
    queryFn: () => listOperationActivitiesApi(path),
  });
}

export function useCreateOperation(key: string, path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OperationRecord) => createOperationApi(path, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["operations", key] });
      void qc.invalidateQueries({ queryKey: ["operations-summary"] });
      void qc.invalidateQueries({ queryKey: ["operations-activities"] });
      void qc.invalidateQueries({ queryKey: ["admin-crm"] });
    },
  });
}

export function usePatchOperation(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, input }: { path: string; input?: OperationRecord }) => patchOperationApi(path, input ?? {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["operations", key] });
      void qc.invalidateQueries({ queryKey: ["operations-summary"] });
      void qc.invalidateQueries({ queryKey: ["operations-activities"] });
      void qc.invalidateQueries({ queryKey: ["admin-crm"] });
    },
  });
}
