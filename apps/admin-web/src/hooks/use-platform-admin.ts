"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveOrganizationApi,
  approveVerificationApi,
  getOrganizationReviewApi,
  getVerificationApi,
  getVerificationQueueApi,
  listOrganizationsApi,
  reactivateOrganizationApi,
  rejectOrganizationApi,
  rejectVerificationApi,
  requestMoreVerificationApi,
  suspendOrganizationApi,
} from "@/lib/api";
import type { ReviewActionInput } from "@/types/platform";

export function useOrganizations() {
  return useQuery({
    queryKey: ["platform", "organizations"],
    queryFn: listOrganizationsApi,
  });
}

export function useOrganizationReview(id: string) {
  return useQuery({
    queryKey: ["platform", "organizations", id, "review"],
    queryFn: () => getOrganizationReviewApi(id),
    enabled: Boolean(id),
  });
}

export function useVerificationQueue() {
  return useQuery({
    queryKey: ["platform", "verification-queue"],
    queryFn: getVerificationQueueApi,
  });
}

export function useVerification(id: string) {
  return useQuery({
    queryKey: ["platform", "verifications", id],
    queryFn: () => getVerificationApi(id),
    enabled: Boolean(id),
  });
}

function useOrganizationAction(
  mutationFn: (id: string, input: ReviewActionInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewActionInput }) =>
      mutationFn(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
      void queryClient.invalidateQueries({
        queryKey: ["platform", "organizations", variables.id, "review"],
      });
      void queryClient.invalidateQueries({ queryKey: ["platform", "verification-queue"] });
    },
  });
}

function useVerificationAction(
  mutationFn: (id: string, input: ReviewActionInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewActionInput }) =>
      mutationFn(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "verification-queue"] });
      void queryClient.invalidateQueries({
        queryKey: ["platform", "verifications", variables.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    },
  });
}

export function useApproveOrganization() {
  return useOrganizationAction(approveOrganizationApi);
}

export function useRejectOrganization() {
  return useOrganizationAction(rejectOrganizationApi);
}

export function useSuspendOrganization() {
  return useOrganizationAction(suspendOrganizationApi);
}

export function useReactivateOrganization() {
  return useOrganizationAction(reactivateOrganizationApi);
}

export function useApproveVerification() {
  return useVerificationAction(approveVerificationApi);
}

export function useRejectVerification() {
  return useVerificationAction(rejectVerificationApi);
}

export function useRequestMoreVerification() {
  return useVerificationAction(requestMoreVerificationApi);
}
