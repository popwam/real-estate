"use client";

import { apiRequest } from "@/lib/api";
import type {
  CreateOrganizationDomainInput,
  OrganizationDomain,
  PublicLead,
  PublicLeadStatusInput,
  RejectDomainInput,
  WebsiteSettings,
  WebsiteSettingsInput,
} from "@/types/admin-public";

export function listPublicLeadsApi() {
  return apiRequest<PublicLead[]>("/public-leads");
}

export function getPublicLeadApi(id: string) {
  return apiRequest<PublicLead>(`/public-leads/${id}`);
}

export function updatePublicLeadStatusApi(id: string, input: PublicLeadStatusInput) {
  return apiRequest<PublicLead>(`/public-leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function markPublicLeadSpamApi(id: string) {
  return apiRequest<PublicLead>(`/public-leads/${id}/mark-spam`, { method: "PATCH" });
}

export function convertPublicLeadPlaceholderApi(id: string) {
  return apiRequest<PublicLead>(`/public-leads/${id}/convert-placeholder`, { method: "PATCH" });
}

export function getWebsiteSettingsApi() {
  return apiRequest<WebsiteSettings>("/organization-website-settings/me");
}

export function updateWebsiteSettingsApi(input: WebsiteSettingsInput) {
  return apiRequest<WebsiteSettings>("/organization-website-settings/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listOrganizationDomainsApi() {
  return apiRequest<OrganizationDomain[]>("/organization-domains/me");
}

export function createOrganizationDomainApi(input: CreateOrganizationDomainInput) {
  return apiRequest<OrganizationDomain>("/organization-domains/me", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function requestDomainVerificationApi(id: string) {
  return apiRequest<OrganizationDomain>(`/organization-domains/${id}/request-verification`, {
    method: "PATCH",
  });
}

export function checkDomainDnsApi(id: string) {
  return apiRequest<OrganizationDomain>(`/organization-domains/${id}/check-dns`, {
    method: "PATCH",
  });
}

export function testDomainApi(id: string) {
  return apiRequest<OrganizationDomain>(`/organization-domains/${id}/test`, {
    method: "POST",
  });
}

export function setDefaultDomainApi(id: string) {
  return apiRequest<OrganizationDomain>(`/organization-domains/${id}/default`, {
    method: "PATCH",
  });
}

export function deleteOrganizationDomainApi(id: string) {
  return apiRequest<{ deleted: boolean }>(`/organization-domains/${id}`, {
    method: "DELETE",
  });
}

export function markDomainVerifiedDevOnlyApi(id: string) {
  return apiRequest<OrganizationDomain>(`/organization-domains/${id}/mark-verified-dev-only`, {
    method: "PATCH",
  });
}

export function listPlatformDomainsApi() {
  return apiRequest<OrganizationDomain[]>("/platform-admin/domains");
}

export function approvePlatformDomainApi(id: string) {
  return apiRequest<OrganizationDomain>(`/platform-admin/domains/${id}/approve`, {
    method: "PATCH",
  });
}

export function rejectPlatformDomainApi(id: string, input: RejectDomainInput) {
  return apiRequest<OrganizationDomain>(`/platform-admin/domains/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
