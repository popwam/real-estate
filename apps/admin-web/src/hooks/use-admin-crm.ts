"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimCrmLeadApi,
  completeCrmTaskApi,
  createConversationFromCrmLeadApi,
  createConversationMessageApi,
  createCrmLeadNoteApi,
  createCrmLeadTaskApi,
  createCrmTaskApi,
  getCrmSummaryApi,
  getConversationApi,
  getCrmLeadApi,
  listCrmLeadNotesApi,
  listCrmLeadStageHistoryApi,
  listCrmPipelineStagesApi,
  listCrmTasksApi,
  listConversationActivitiesApi,
  listConversationMessagesApi,
  listConversationsApi,
  listCrmActivitiesApi,
  listCrmLeadActivitiesApi,
  listCrmLeadsApi,
  listMarketplaceCrmLeadsApi,
  updateConversationStatusApi,
  updateCrmLeadStageApi,
  updateCrmLeadStatusApi,
} from "@/lib/admin-crm-api";
import type {
  Conversation,
  ConversationListQuery,
  CrmFollowUpTask,
  CrmActivity,
  CrmActivityListQuery,
  CreateConversationFromCrmLeadInput,
  CreateConversationMessageInput,
  CrmLead,
  CrmLeadListQuery,
  CrmLeadStageHistory,
  CrmNote,
  CrmPipelineStage,
  PaginatedResponse,
  PaginationMeta,
  UpdateConversationStatusInput,
  UpdateCrmLeadStatusInput,
} from "@/types/admin-crm";

const crmLeadsKey = ["admin-crm", "leads"] as const;
const marketplaceCrmLeadsKey = ["admin-crm", "marketplace-leads"] as const;
const conversationsKey = ["admin-crm", "conversations"] as const;
const crmSummaryKey = ["admin-crm", "summary"] as const;
const crmActivitiesKey = ["admin-crm", "activities"] as const;
const crmPipelineKey = ["admin-crm", "pipeline"] as const;
const crmNotesKey = ["admin-crm", "notes"] as const;
const crmTasksKey = ["admin-crm", "tasks"] as const;

export function useCrmSummary() {
  return useQuery({ queryKey: crmSummaryKey, queryFn: getCrmSummaryApi });
}

export function useCrmActivities(query?: CrmActivityListQuery) {
  return useQuery({
    queryKey: [...crmActivitiesKey, query ?? {}],
    queryFn: () => listCrmActivitiesApi(query),
  });
}

export function useCrmLeadActivities(id: string, query?: CrmActivityListQuery) {
  return useQuery({
    queryKey: [...crmActivitiesKey, "lead", id, query ?? {}],
    queryFn: () => listCrmLeadActivitiesApi(id, query),
    enabled: Boolean(id),
  });
}

export function useConversationActivities(id: string, query?: CrmActivityListQuery) {
  return useQuery({
    queryKey: [...crmActivitiesKey, "conversation", id, query ?? {}],
    queryFn: () => listConversationActivitiesApi(id, query),
    enabled: Boolean(id),
  });
}

export function useCrmLeads(query?: CrmLeadListQuery, enabled = true) {
  return useQuery({
    queryKey: [...crmLeadsKey, query ?? {}],
    queryFn: async () => normalizeListResponse(await listCrmLeadsApi(query)),
    enabled,
  });
}

export function useCrmLead(id: string) {
  return useQuery({
    queryKey: [...crmLeadsKey, id],
    queryFn: () => getCrmLeadApi(id),
    enabled: Boolean(id),
  });
}

export function useCrmPipelineStages() {
  return useQuery({
    queryKey: crmPipelineKey,
    queryFn: listCrmPipelineStagesApi,
  });
}

export function useUpdateCrmLeadStage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { stageId: string; note?: string }) => updateCrmLeadStageApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: crmPipelineKey });
      void qc.invalidateQueries({ queryKey: crmLeadsKey });
      void qc.invalidateQueries({ queryKey: [...crmLeadsKey, id] });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useCrmLeadStageHistory(id: string) {
  return useQuery({
    queryKey: [...crmPipelineKey, "history", id],
    queryFn: () => listCrmLeadStageHistoryApi(id),
    enabled: Boolean(id),
  });
}

export function useCrmLeadNotes(id: string) {
  return useQuery({
    queryKey: [...crmNotesKey, "lead", id],
    queryFn: () => listCrmLeadNotesApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateCrmLeadNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string }) => createCrmLeadNoteApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...crmNotesKey, "lead", id] });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useCrmTasks() {
  return useQuery({
    queryKey: crmTasksKey,
    queryFn: listCrmTasksApi,
  });
}

export function useCreateCrmLeadTask(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; dueAt?: string; priority?: string; assignedToUserId?: string }) => createCrmLeadTaskApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: crmTasksKey });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useCreateCrmTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; crmLeadId?: string; dueAt?: string; priority?: string; assignedToUserId?: string }) => createCrmTaskApi(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: crmTasksKey });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useCompleteCrmTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeCrmTaskApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: crmTasksKey });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useMarketplaceCrmLeads(query?: CrmLeadListQuery, enabled = true) {
  return useQuery({
    queryKey: [...marketplaceCrmLeadsKey, query ?? {}],
    queryFn: async () => normalizeListResponse(await listMarketplaceCrmLeadsApi(query)),
    enabled,
  });
}

export function useClaimCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimCrmLeadApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: crmLeadsKey });
      void qc.invalidateQueries({ queryKey: marketplaceCrmLeadsKey });
      void qc.invalidateQueries({ queryKey: crmSummaryKey });
      void qc.invalidateQueries({ queryKey: [...crmLeadsKey, id] });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useUpdateCrmLeadStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCrmLeadStatusInput) => updateCrmLeadStatusApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: crmLeadsKey });
      void qc.invalidateQueries({ queryKey: marketplaceCrmLeadsKey });
      void qc.invalidateQueries({ queryKey: crmSummaryKey });
      void qc.invalidateQueries({ queryKey: [...crmLeadsKey, id] });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useConversations(query?: ConversationListQuery) {
  return useQuery({
    queryKey: [...conversationsKey, query ?? {}],
    queryFn: async () => normalizeListResponse(await listConversationsApi(query)),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: [...conversationsKey, id],
    queryFn: () => getConversationApi(id),
    enabled: Boolean(id),
  });
}

export function useConversationMessages(id: string) {
  return useQuery({
    queryKey: [...conversationsKey, id, "messages"],
    queryFn: () => listConversationMessagesApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateConversationMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConversationMessageInput) => createConversationMessageApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...conversationsKey, id] });
      void qc.invalidateQueries({ queryKey: [...conversationsKey, id, "messages"] });
      void qc.invalidateQueries({ queryKey: conversationsKey });
      void qc.invalidateQueries({ queryKey: crmSummaryKey });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useUpdateConversationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConversationStatusInput) => updateConversationStatusApi(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: conversationsKey });
      void qc.invalidateQueries({ queryKey: crmSummaryKey });
      void qc.invalidateQueries({ queryKey: [...conversationsKey, id] });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

export function useCreateConversationFromCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ crmLeadId, input }: { crmLeadId: string; input?: CreateConversationFromCrmLeadInput }) =>
      createConversationFromCrmLeadApi(crmLeadId, input ?? {}),
    onSuccess: (_data, value) => {
      void qc.invalidateQueries({ queryKey: conversationsKey });
      void qc.invalidateQueries({ queryKey: crmLeadsKey });
      void qc.invalidateQueries({ queryKey: crmSummaryKey });
      void qc.invalidateQueries({ queryKey: [...crmLeadsKey, value.crmLeadId] });
      void qc.invalidateQueries({ queryKey: crmActivitiesKey });
    },
  });
}

function normalizeListResponse<T>(response: T[] | PaginatedResponse<T>): PaginatedResponse<T> {
  if (Array.isArray(response)) {
    return {
      items: response,
      pagination: {
        page: 1,
        pageSize: response.length,
        total: response.length,
        totalPages: response.length ? 1 : 0,
      },
    };
  }
  return response;
}

export type NormalizedCrmLeadList = PaginatedResponse<CrmLead>;
export type NormalizedConversationList = PaginatedResponse<Conversation>;
export type NormalizedCrmActivityList = PaginatedResponse<CrmActivity>;
export type CrmPipelineStageList = CrmPipelineStage[];
export type CrmLeadStageHistoryList = CrmLeadStageHistory[];
export type CrmNoteList = CrmNote[];
export type CrmFollowUpTaskList = CrmFollowUpTask[];
export type { PaginationMeta };
