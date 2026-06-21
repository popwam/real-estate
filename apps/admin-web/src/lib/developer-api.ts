"use client";

import { apiRequest } from "@/lib/api";
import type {
  AgreementInput,
  BrokerAccessRule,
  BrokerAccessRuleInput,
  DeveloperAgreement,
  InventoryUnit,
  InventoryUnitInput,
  PaymentPlan,
  PaymentPlanInput,
  Project,
  ProjectInput,
  ProjectPhase,
  ProjectPhaseInput,
  ProjectVisibility,
  ProjectSellingMode,
  ProjectBrokerAuthorization,
} from "@/types/developer";

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function listProjectsApi(filters: Record<string, string | undefined> = {}) {
  return apiRequest<Project[]>(`/projects${qs(filters)}`);
}

export function createProjectApi(input: ProjectInput) {
  return apiRequest<Project>("/projects", { method: "POST", body: JSON.stringify(input) });
}

export function getProjectApi(id: string) {
  return apiRequest<Project>(`/projects/${id}`);
}

export function updateProjectApi(id: string, input: ProjectInput) {
  return apiRequest<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function updateProjectVisibilityApi(id: string, visibility: ProjectVisibility) {
  return apiRequest<Project>(`/projects/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ visibility }),
  });
}

export function updateProjectSellingModeApi(id: string, sellingMode: ProjectSellingMode) {
  return apiRequest<Project>(`/projects/${id}/selling-mode`, {
    method: "PATCH",
    body: JSON.stringify({ sellingMode }),
  });
}

export function listProjectBrokerAuthorizationsApi(id: string) {
  return apiRequest<ProjectBrokerAuthorization[]>(`/projects/${id}/broker-authorizations`);
}

export function createProjectBrokerAuthorizationApi(id: string, input: { organizationId?: string; brokerUserId?: string }) {
  return apiRequest<ProjectBrokerAuthorization>(`/projects/${id}/broker-authorizations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeProjectBrokerAuthorizationApi(id: string, authorizationId: string) {
  return apiRequest<ProjectBrokerAuthorization>(`/projects/${id}/broker-authorizations/${authorizationId}`, {
    method: "DELETE",
  });
}

export function listProjectPhasesApi(projectId: string) {
  return apiRequest<ProjectPhase[]>(`/projects/${projectId}/phases`);
}

export function createProjectPhaseApi(projectId: string, input: ProjectPhaseInput) {
  return apiRequest<ProjectPhase>(`/projects/${projectId}/phases`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProjectPhaseApi(projectId: string, id: string, input: ProjectPhaseInput) {
  return apiRequest<ProjectPhase>(`/projects/${projectId}/phases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listInventoryUnitsApi(filters: Record<string, string | undefined> = {}) {
  return apiRequest<InventoryUnit[]>(`/inventory/units${qs(filters)}`);
}

export function createInventoryUnitApi(input: InventoryUnitInput) {
  return apiRequest<InventoryUnit>("/inventory/units", { method: "POST", body: JSON.stringify(input) });
}

export function getInventoryUnitApi(id: string) {
  return apiRequest<InventoryUnit>(`/inventory/units/${id}`);
}

export function updateInventoryUnitApi(id: string, input: InventoryUnitInput) {
  return apiRequest<InventoryUnit>(`/inventory/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listPaymentPlansApi(projectId: string) {
  return apiRequest<PaymentPlan[]>(`/projects/${projectId}/payment-plans`);
}

export function createPaymentPlanApi(projectId: string, input: PaymentPlanInput) {
  return apiRequest<PaymentPlan>(`/projects/${projectId}/payment-plans`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listAgreementsApi() {
  return apiRequest<DeveloperAgreement[]>("/agreements");
}

export function createAgreementApi(input: AgreementInput) {
  return apiRequest<DeveloperAgreement>("/agreements", { method: "POST", body: JSON.stringify(input) });
}

export function approveAgreementApi(id: string) {
  return apiRequest<DeveloperAgreement>(`/agreements/${id}/approve`, { method: "PATCH" });
}

export function suspendAgreementApi(id: string) {
  return apiRequest<DeveloperAgreement>(`/agreements/${id}/suspend`, { method: "PATCH" });
}

export function terminateAgreementApi(id: string) {
  return apiRequest<DeveloperAgreement>(`/agreements/${id}/terminate`, { method: "PATCH" });
}

export function listBrokerAccessRulesApi() {
  return apiRequest<BrokerAccessRule[]>("/broker-access-rules");
}

export function createBrokerAccessRuleApi(input: BrokerAccessRuleInput) {
  return apiRequest<BrokerAccessRule>("/broker-access-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBrokerAccessRuleApi(id: string, input: Partial<BrokerAccessRuleInput>) {
  return apiRequest<BrokerAccessRule>(`/broker-access-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteBrokerAccessRuleApi(id: string) {
  return apiRequest<{ success: boolean }>(`/broker-access-rules/${id}`, { method: "DELETE" });
}
