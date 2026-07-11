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
  createPlatformOrganizationApi,
  createOrganizationAttendanceLocationApi,
  createOrganizationOfficeApi,
  createOrganizationProvisioningDomainApi,
  createOrganizationWifiRuleApi,
  listOrganizationInvitationsApi,
  createOrganizationInvitationApi,
  getPlatformOrganizationApi,
  getPlatformOrganizationLimitsApi,
  getPlatformOrganizationSubscriptionApi,
  listOrganizationAttendanceLocationsApi,
  listOrganizationOfficesApi,
  listOrganizationProvisioningDomainsApi,
  listOrganizationWifiRulesApi,
  setDefaultOrganizationProvisioningDomainApi,
  updateOrganizationAttendanceLocationApi,
  updateOrganizationOfficeApi,
  updateOrganizationProvisioningDomainApi,
  updateOrganizationWifiRuleApi,
  updatePlatformOrganizationApi,
  updatePlatformOrganizationLimitsApi,
  updatePlatformOrganizationSubscriptionApi,
} from "@/lib/api";
import type {
  OrganizationAttendanceLocation,
  OrganizationDomainRecord,
  OrganizationLimits,
  OrganizationOffice,
  OrganizationSubscription,
  OrganizationWifiRule,
  PlatformOrganizationInput,
  ReviewActionInput,
} from "@/types/platform";

export function useOrganizations() {
  return useQuery({
    queryKey: ["platform", "organizations"],
    queryFn: listOrganizationsApi,
  });
}

export function useCreatePlatformOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlatformOrganizationInput) => createPlatformOrganizationApi(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] }),
  });
}

export function usePlatformOrganization(id: string) {
  return useQuery({
    queryKey: ["platform", "organizations", id, "provisioning"],
    queryFn: () => getPlatformOrganizationApi(id),
    enabled: Boolean(id),
  });
}

export function useUpdatePlatformOrganization(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PlatformOrganizationInput>) => updatePlatformOrganizationApi(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
    },
  });
}

export function usePlatformOrganizationSubscription(id: string) {
  return useQuery({
    queryKey: ["platform", "organizations", id, "subscription"],
    queryFn: () => getPlatformOrganizationSubscriptionApi(id),
    enabled: Boolean(id),
  });
}

export function useUpdatePlatformOrganizationSubscription(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationSubscription>) => updatePlatformOrganizationSubscriptionApi(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "provisioning"] });
    },
  });
}

export function usePlatformOrganizationLimits(id: string) {
  return useQuery({
    queryKey: ["platform", "organizations", id, "limits"],
    queryFn: () => getPlatformOrganizationLimitsApi(id),
    enabled: Boolean(id),
  });
}

export function useUpdatePlatformOrganizationLimits(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationLimits>) => updatePlatformOrganizationLimitsApi(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "limits"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "provisioning"] });
    },
  });
}

export function useOrganizationOffices(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "offices"], queryFn: () => listOrganizationOfficesApi(id), enabled: Boolean(id) });
}

export function useCreateOrganizationOffice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationOffice>) => createOrganizationOfficeApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useUpdateOrganizationOffice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ officeId, input }: { officeId: string; input: Partial<OrganizationOffice> }) => updateOrganizationOfficeApi(id, officeId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationAttendanceLocations(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "attendance-locations"], queryFn: () => listOrganizationAttendanceLocationsApi(id), enabled: Boolean(id) });
}

export function useCreateOrganizationAttendanceLocation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationAttendanceLocation>) => createOrganizationAttendanceLocationApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useUpdateOrganizationAttendanceLocation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, input }: { locationId: string; input: Partial<OrganizationAttendanceLocation> }) => updateOrganizationAttendanceLocationApi(id, locationId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationWifiRules(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "wifi-rules"], queryFn: () => listOrganizationWifiRulesApi(id), enabled: Boolean(id) });
}

export function useCreateOrganizationWifiRule(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationWifiRule>) => createOrganizationWifiRuleApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useUpdateOrganizationWifiRule(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: Partial<OrganizationWifiRule> }) => updateOrganizationWifiRuleApi(id, ruleId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationProvisioningDomains(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "domains"], queryFn: () => listOrganizationProvisioningDomainsApi(id), enabled: Boolean(id) });
}

export function useCreateOrganizationProvisioningDomain(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationDomainRecord>) => createOrganizationProvisioningDomainApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useUpdateOrganizationProvisioningDomain(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ domainId, input }: { domainId: string; input: Partial<OrganizationDomainRecord> }) => updateOrganizationProvisioningDomainApi(id, domainId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useSetDefaultOrganizationProvisioningDomain(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) => setDefaultOrganizationProvisioningDomainApi(id, domainId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationInvitations(id: string) {
  return useQuery({
    queryKey: ["platform", "organizations", id, "invitations"],
    queryFn: () => listOrganizationInvitationsApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrganizationInvitation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; intendedRole: string; expiresInHours?: number }) =>
      createOrganizationInvitationApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "invitations"] }),
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
