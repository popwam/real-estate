"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveAgreementApi,
  createAgreementApi,
  createBrokerAccessRuleApi,
  createInventoryUnitApi,
  createPaymentPlanApi,
  createProjectApi,
  createProjectPhaseApi,
  deleteBrokerAccessRuleApi,
  getProjectApi,
  listAgreementsApi,
  listBrokerAccessRulesApi,
  listInventoryUnitsApi,
  listPaymentPlansApi,
  listProjectPhasesApi,
  listProjectsApi,
  suspendAgreementApi,
  terminateAgreementApi,
  updateBrokerAccessRuleApi,
  updateInventoryUnitApi,
  updateProjectApi,
  updateProjectPhaseApi,
  updateProjectVisibilityApi,
  updateProjectSellingModeApi,
  listProjectBrokerAuthorizationsApi,
  createProjectBrokerAuthorizationApi,
  removeProjectBrokerAuthorizationApi,
} from "@/lib/developer-api";
import type {
  BrokerAccessRuleInput,
  InventoryUnitInput,
  PaymentPlanInput,
  ProjectInput,
  ProjectPhaseInput,
  ProjectVisibility,
  ProjectSellingMode,
} from "@/types/developer";

export function useProjects(filters: Record<string, string | undefined> = {}) {
  return useQuery({ queryKey: ["developer", "projects", filters], queryFn: () => listProjectsApi(filters) });
}
export function useProject(id: string) {
  return useQuery({ queryKey: ["developer", "projects", id], queryFn: () => getProjectApi(id), enabled: Boolean(id) });
}
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createProjectApi, onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects"] }) });
}
export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ProjectInput }) => updateProjectApi(id, input), onSuccess: (_data, v) => {
    void qc.invalidateQueries({ queryKey: ["developer", "projects"] });
    void qc.invalidateQueries({ queryKey: ["developer", "projects", v.id] });
  } });
}
export function useUpdateProjectVisibility() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, visibility }: { id: string; visibility: ProjectVisibility }) => updateProjectVisibilityApi(id, visibility), onSuccess: (_data, v) => {
    void qc.invalidateQueries({ queryKey: ["developer", "projects"] });
    void qc.invalidateQueries({ queryKey: ["developer", "projects", v.id] });
  } });
}
export function useProjectBrokerAuthorizations(projectId: string) {
  return useQuery({
    queryKey: ["developer", "projects", projectId, "broker-authorizations"],
    queryFn: () => listProjectBrokerAuthorizationsApi(projectId),
    enabled: Boolean(projectId),
  });
}
export function useUpdateProjectSellingMode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sellingMode: ProjectSellingMode) => updateProjectSellingModeApi(projectId, sellingMode),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects", projectId] }),
  });
}
export function useCreateProjectBrokerAuthorization(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId?: string; brokerUserId?: string }) => createProjectBrokerAuthorizationApi(projectId, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects", projectId, "broker-authorizations"] }),
  });
}
export function useRemoveProjectBrokerAuthorization(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorizationId: string) => removeProjectBrokerAuthorizationApi(projectId, authorizationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects", projectId, "broker-authorizations"] }),
  });
}
export function useProjectPhases(projectId: string) {
  return useQuery({ queryKey: ["developer", "projects", projectId, "phases"], queryFn: () => listProjectPhasesApi(projectId), enabled: Boolean(projectId) });
}
export function useCreateProjectPhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: ProjectPhaseInput) => createProjectPhaseApi(projectId, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects", projectId, "phases"] }) });
}
export function useUpdateProjectPhase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: ProjectPhaseInput }) => updateProjectPhaseApi(projectId, id, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects", projectId, "phases"] }) });
}
export function useInventoryUnits(filters: Record<string, string | undefined> = {}) {
  return useQuery({ queryKey: ["developer", "inventory", filters], queryFn: () => listInventoryUnitsApi(filters) });
}
export function useCreateInventoryUnit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createInventoryUnitApi, onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "inventory"] }) });
}
export function useUpdateInventoryUnit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: InventoryUnitInput }) => updateInventoryUnitApi(id, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "inventory"] }) });
}
export function usePaymentPlans(projectId: string) {
  return useQuery({ queryKey: ["developer", "projects", projectId, "payment-plans"], queryFn: () => listPaymentPlansApi(projectId), enabled: Boolean(projectId) });
}
export function useCreatePaymentPlan(projectId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: PaymentPlanInput) => createPaymentPlanApi(projectId, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "projects", projectId, "payment-plans"] }) });
}
export function useAgreements() {
  return useQuery({ queryKey: ["developer", "agreements"], queryFn: listAgreementsApi });
}
export function useCreateAgreement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createAgreementApi, onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "agreements"] }) });
}
export function useAgreementAction(action: "approve" | "suspend" | "terminate") {
  const qc = useQueryClient();
  const fn = action === "approve" ? approveAgreementApi : action === "suspend" ? suspendAgreementApi : terminateAgreementApi;
  return useMutation({ mutationFn: fn, onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "agreements"] }) });
}
export function useBrokerAccessRules() {
  return useQuery({ queryKey: ["developer", "broker-access-rules"], queryFn: listBrokerAccessRulesApi });
}
export function useCreateBrokerAccessRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createBrokerAccessRuleApi, onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "broker-access-rules"] }) });
}
export function useUpdateBrokerAccessRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<BrokerAccessRuleInput> }) => updateBrokerAccessRuleApi(id, input), onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "broker-access-rules"] }) });
}
export function useDeleteBrokerAccessRule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteBrokerAccessRuleApi, onSuccess: () => void qc.invalidateQueries({ queryKey: ["developer", "broker-access-rules"] }) });
}
