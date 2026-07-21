"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SESSION_QUERY_KEY } from "@/components/providers/auth-session-provider";
import {
  activateOrganizationApi,
  approveOrganizationApi,
  approveVerificationApi,
  createCompanyRoleTemplateApi,
  createOrganizationFirstAdminApi,
  createPlatformPlanApi,
  createRequiredDocumentPolicyApi,
  getOrganizationReviewApi,
  getOrganizationActivationCheckApi,
  getPlatformDomainSettingsApi,
  getPlatformModulesApi,
  getPlatformSettingsApi,
  getVerificationApi,
  getVerificationQueueApi,
  listCompanyRoleTemplatesApi,
  listOrganizationsApi,
  listPlatformPlansApi,
  listPlatformSubscriptionsApi,
  listRequiredDocumentPoliciesApi,
  reactivateOrganizationApi,
  rejectOrganizationApi,
  rejectProvisioningOrganizationApi,
  rejectVerificationApi,
  requestMoreVerificationApi,
  reviewOrganizationDocumentApi,
  reviewOrganizationDocumentFieldsApi,
  suspendOrganizationApi,
  createPlatformOrganizationApi,
  createOrganizationAttendanceLocationApi,
  createOrganizationDocumentApi,
  createOrganizationOfficeApi,
  createOrganizationOwnerApi,
  createOrganizationProvisioningDomainApi,
  createOrganizationWifiRuleApi,
  extractOrganizationDocumentApi,
  getMetadataCountriesApi,
  getMetadataCurrenciesApi,
  getMetadataLanguagesApi,
  getMetadataOrganizationTypesApi,
  getMetadataTimezonesApi,
  getOrganizationDomainDiagnosticsApi,
  getOrganizationLegalApi,
  getOrganizationPublicSiteApi,
  listOrganizationInvitationsApi,
  listOrganizationDocumentsApi,
  createOrganizationInvitationApi,
  listOrganizationOwnersApi,
  getPlatformOrganizationApi,
  getPlatformOrganizationLimitsApi,
  getPlatformOrganizationSubscriptionApi,
  listOrganizationAttendanceLocationsApi,
  listOrganizationOfficesApi,
  listOrganizationProvisioningDomainsApi,
  listOrganizationWifiRulesApi,
  setDefaultOrganizationProvisioningDomainApi,
  updateOrganizationAttendanceLocationApi,
  updateOrganizationDocumentApi,
  updateOrganizationLegalApi,
  updateOrganizationOfficeApi,
  updateOrganizationOwnerApi,
  updateOrganizationPublicSiteApi,
  updateOrganizationProvisioningDomainApi,
  updateOrganizationWifiRuleApi,
  updateCompanyRoleTemplateApi,
  updatePlatformPlanApi,
  updatePlatformOrganizationApi,
  updatePlatformOrganizationLimitsApi,
  updatePlatformOrganizationSubscriptionApi,
  updateRequiredDocumentPolicyApi,
  uploadOrganizationDocumentApi,
} from "@/lib/api";
import type {
  CompanyRoleTemplate,
  FirstAdminInput,
  OrganizationAttendanceLocation,
  OrganizationDomainRecord,
  OrganizationDocument,
  OrganizationLimits,
  OrganizationLegal,
  OrganizationOffice,
  OrganizationOwner,
  OrganizationPublicSiteSettings,
  OrganizationSubscription,
  OrganizationWifiRule,
  PlatformPlan,
  PlatformOrganizationInput,
  RequiredDocumentPolicy,
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

export function useOrganizationActivationCheck(id: string) {
  return useQuery({
    queryKey: ["platform", "organizations", id, "activation-check"],
    queryFn: () => getOrganizationActivationCheckApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrganizationFirstAdmin(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FirstAdminInput) => createOrganizationFirstAdminApi(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "provisioning"] }),
        queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "activation-check"] }),
      ]);
    },
  });
}

export function useActivateOrganization(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => activateOrganizationApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
    },
  });
}

export function useRejectProvisioningOrganization(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { reason: string; notes?: string }) => rejectProvisioningOrganizationApi(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
    },
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

export function useOrganizationPublicSite(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "public-site"], queryFn: () => getOrganizationPublicSiteApi(id), enabled: Boolean(id) });
}

export function useUpdateOrganizationPublicSite(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationPublicSiteSettings>) => updateOrganizationPublicSiteApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationDomainDiagnostics(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "domain-diagnostics"], queryFn: () => getOrganizationDomainDiagnosticsApi(id), enabled: Boolean(id) });
}

export function useOrganizationLegal(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "legal"], queryFn: () => getOrganizationLegalApi(id), enabled: Boolean(id) });
}

export function useUpdateOrganizationLegal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationLegal>) => updateOrganizationLegalApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationOwners(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "owners"], queryFn: () => listOrganizationOwnersApi(id), enabled: Boolean(id) });
}

export function useCreateOrganizationOwner(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationOwner>) => createOrganizationOwnerApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useUpdateOrganizationOwner(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerId, input }: { ownerId: string; input: Partial<OrganizationOwner> }) => updateOrganizationOwnerApi(id, ownerId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useOrganizationDocuments(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "documents"], queryFn: () => listOrganizationDocumentsApi(id), enabled: Boolean(id) });
}

export function useCreateOrganizationDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OrganizationDocument>) => createOrganizationDocumentApi(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useUpdateOrganizationDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: Partial<OrganizationDocument> }) => updateOrganizationDocumentApi(id, documentId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useExtractOrganizationDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => extractOrganizationDocumentApi(id, documentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] }),
  });
}

export function useReviewOrganizationDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: { status?: string; note?: string } }) =>
      reviewOrganizationDocumentApi(id, documentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "activation-check"] });
    },
  });
}

export function useUploadOrganizationDocument(id: string) {
  return useMutation({ mutationFn: (file: File) => uploadOrganizationDocumentApi(id, file) });
}

export function useReviewOrganizationDocumentFields(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: { fields: string[]; action: "APPLY" | "REJECT"; confirmSensitive?: boolean } }) =>
      reviewOrganizationDocumentFieldsApi(id, documentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "documents"] });
    },
  });
}

export function useCompanyRoleTemplates(id: string) {
  return useQuery({ queryKey: ["platform", "organizations", id, "access-levels"], queryFn: () => listCompanyRoleTemplatesApi(id), enabled: Boolean(id) });
}

export function useCreateCompanyRoleTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CompanyRoleTemplate>) => createCompanyRoleTemplateApi(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "access-levels"] });
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY, exact: true });
    },
  });
}

export function useUpdateCompanyRoleTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, input }: { templateId: string; input: Partial<CompanyRoleTemplate> }) => updateCompanyRoleTemplateApi(id, templateId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id, "access-levels"] });
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY, exact: true });
    },
  });
}

export function usePlatformSettings() {
  return useQuery({ queryKey: ["platform", "settings"], queryFn: getPlatformSettingsApi });
}

export function usePlatformPlans() {
  return useQuery({ queryKey: ["platform", "settings", "plans"], queryFn: listPlatformPlansApi });
}

export function useCreatePlatformPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PlatformPlan>) => createPlatformPlanApi(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "settings", "plans"] }),
  });
}

export function useUpdatePlatformPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: Partial<PlatformPlan> }) => updatePlatformPlanApi(planId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "settings", "plans"] }),
  });
}

export function usePlatformSubscriptions() {
  return useQuery({ queryKey: ["platform", "settings", "subscriptions"], queryFn: listPlatformSubscriptionsApi });
}

export function useRequiredDocumentPolicies() {
  return useQuery({ queryKey: ["platform", "settings", "verification-policies"], queryFn: listRequiredDocumentPoliciesApi });
}

export function useCreateRequiredDocumentPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RequiredDocumentPolicy>) => createRequiredDocumentPolicyApi(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "settings", "verification-policies"] }),
  });
}

export function useUpdateRequiredDocumentPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, input }: { policyId: string; input: Partial<RequiredDocumentPolicy> }) => updateRequiredDocumentPolicyApi(policyId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["platform", "settings", "verification-policies"] }),
  });
}

export function usePlatformModules() {
  return useQuery({ queryKey: ["platform", "settings", "modules"], queryFn: getPlatformModulesApi });
}

export function usePlatformDomainSettings() {
  return useQuery({ queryKey: ["platform", "settings", "domains"], queryFn: getPlatformDomainSettingsApi });
}

export function useMetadataCountries() {
  return useQuery({ queryKey: ["metadata", "countries"], queryFn: getMetadataCountriesApi });
}

export function useMetadataCurrencies() {
  return useQuery({ queryKey: ["metadata", "currencies"], queryFn: getMetadataCurrenciesApi });
}

export function useMetadataLanguages() {
  return useQuery({ queryKey: ["metadata", "languages"], queryFn: getMetadataLanguagesApi });
}

export function useMetadataTimezones() {
  return useQuery({ queryKey: ["metadata", "timezones"], queryFn: getMetadataTimezonesApi });
}

export function useMetadataOrganizationTypes() {
  return useQuery({ queryKey: ["metadata", "organization-types"], queryFn: getMetadataOrganizationTypesApi });
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
