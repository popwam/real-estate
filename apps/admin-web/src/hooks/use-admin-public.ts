"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approvePlatformDomainApi,
  checkDomainDnsApi,
  convertPublicLeadPlaceholderApi,
  createOrganizationDomainApi,
  getPublicLeadApi,
  getWebsiteSettingsApi,
  listOrganizationDomainsApi,
  listPlatformDomainsApi,
  listPublicLeadsApi,
  markDomainVerifiedDevOnlyApi,
  markPublicLeadSpamApi,
  rejectPlatformDomainApi,
  requestDomainVerificationApi,
  updatePublicLeadStatusApi,
  updateWebsiteSettingsApi,
} from "@/lib/admin-public-api";
import type {
  CreateOrganizationDomainInput,
  PublicLeadStatusInput,
  RejectDomainInput,
  WebsiteSettingsInput,
} from "@/types/admin-public";

const publicLeadsKey = ["admin-public", "public-leads"] as const;
const websiteSettingsKey = ["admin-public", "website-settings"] as const;
const organizationDomainsKey = ["admin-public", "organization-domains"] as const;
const platformDomainsKey = ["admin-public", "platform-domains"] as const;

export function usePublicLeads() {
  return useQuery({ queryKey: publicLeadsKey, queryFn: listPublicLeadsApi });
}

export function usePublicLead(id: string) {
  return useQuery({
    queryKey: [...publicLeadsKey, id],
    queryFn: () => getPublicLeadApi(id),
    enabled: Boolean(id),
  });
}

export function useUpdatePublicLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PublicLeadStatusInput }) =>
      updatePublicLeadStatusApi(id, input),
    onSuccess: (_data, value) => {
      void qc.invalidateQueries({ queryKey: publicLeadsKey });
      void qc.invalidateQueries({ queryKey: [...publicLeadsKey, value.id] });
    },
  });
}

export function useMarkPublicLeadSpam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markPublicLeadSpamApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: publicLeadsKey });
      void qc.invalidateQueries({ queryKey: [...publicLeadsKey, id] });
    },
  });
}

export function useConvertPublicLeadPlaceholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => convertPublicLeadPlaceholderApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: publicLeadsKey });
      void qc.invalidateQueries({ queryKey: [...publicLeadsKey, id] });
    },
  });
}

export function useWebsiteSettings() {
  return useQuery({ queryKey: websiteSettingsKey, queryFn: getWebsiteSettingsApi });
}

export function useUpdateWebsiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WebsiteSettingsInput) => updateWebsiteSettingsApi(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: websiteSettingsKey }),
  });
}

export function useOrganizationDomains() {
  return useQuery({ queryKey: organizationDomainsKey, queryFn: listOrganizationDomainsApi });
}

export function useCreateOrganizationDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrganizationDomainInput) => createOrganizationDomainApi(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: organizationDomainsKey }),
  });
}

export function useRequestDomainVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestDomainVerificationApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationDomainsKey });
      void qc.invalidateQueries({ queryKey: platformDomainsKey });
    },
  });
}

export function useCheckDomainDns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkDomainDnsApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationDomainsKey });
      void qc.invalidateQueries({ queryKey: platformDomainsKey });
    },
  });
}

export function useMarkDomainVerifiedDevOnly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markDomainVerifiedDevOnlyApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationDomainsKey });
      void qc.invalidateQueries({ queryKey: platformDomainsKey });
    },
  });
}

export function usePlatformDomains() {
  return useQuery({ queryKey: platformDomainsKey, queryFn: listPlatformDomainsApi });
}

export function useApprovePlatformDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approvePlatformDomainApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformDomainsKey });
      void qc.invalidateQueries({ queryKey: organizationDomainsKey });
    },
  });
}

export function useRejectPlatformDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectDomainInput }) =>
      rejectPlatformDomainApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformDomainsKey });
      void qc.invalidateQueries({ queryKey: organizationDomainsKey });
    },
  });
}
