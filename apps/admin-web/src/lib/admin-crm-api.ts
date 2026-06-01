"use client";

import { apiRequest } from "@/lib/api";
import type {
  Conversation,
  ConversationListQuery,
  ConversationMessage,
  CrmFollowUpTask,
  CrmActivity,
  CrmActivityListQuery,
  CreateConversationFromCrmLeadInput,
  CreateConversationMessageInput,
  CrmLead,
  CrmLeadStageHistory,
  CrmNote,
  CrmPipelineStage,
  CrmLeadListQuery,
  CrmSummary,
  PaginatedResponse,
  UpdateConversationStatusInput,
  UpdateCrmLeadStatusInput,
} from "@/types/admin-crm";

export function listCrmLeadsApi(query?: CrmLeadListQuery) {
  return apiRequest<CrmLead[] | PaginatedResponse<CrmLead>>(withQuery("/crm/leads", query));
}

export function getCrmLeadApi(id: string) {
  return apiRequest<CrmLead>(`/crm/leads/${id}`);
}

export function listMarketplaceCrmLeadsApi(query?: CrmLeadListQuery) {
  return apiRequest<CrmLead[] | PaginatedResponse<CrmLead>>(withQuery("/crm/leads/marketplace", query));
}

export function claimCrmLeadApi(id: string) {
  return apiRequest<CrmLead>(`/crm/leads/${id}/claim`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function updateCrmLeadStatusApi(id: string, input: UpdateCrmLeadStatusInput) {
  return apiRequest<CrmLead>(`/crm/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listCrmPipelineStagesApi() {
  return apiRequest<CrmPipelineStage[]>("/crm/pipeline/stages");
}

export function updateCrmLeadStageApi(id: string, input: { stageId: string; note?: string }) {
  return apiRequest<CrmLead>(`/crm/leads/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listCrmLeadStageHistoryApi(id: string) {
  return apiRequest<CrmLeadStageHistory[]>(`/crm/leads/${id}/stage-history`);
}

export function listCrmLeadNotesApi(id: string) {
  return apiRequest<CrmNote[]>(`/crm/leads/${id}/notes`);
}

export function createCrmLeadNoteApi(id: string, input: { body: string }) {
  return apiRequest<CrmNote>(`/crm/leads/${id}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listCrmTasksApi() {
  return apiRequest<CrmFollowUpTask[]>("/crm/tasks");
}

export function createCrmLeadTaskApi(id: string, input: { title: string; dueAt?: string; priority?: string; assignedToUserId?: string }) {
  return apiRequest<CrmFollowUpTask>("/crm/tasks", {
    method: "POST",
    body: JSON.stringify({ ...input, crmLeadId: id }),
  });
}

export function createCrmTaskApi(input: { title: string; crmLeadId?: string; dueAt?: string; priority?: string; assignedToUserId?: string }) {
  return apiRequest<CrmFollowUpTask>("/crm/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function completeCrmTaskApi(id: string) {
  return apiRequest<CrmFollowUpTask>(`/crm/tasks/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export function getCrmSummaryApi() {
  return apiRequest<CrmSummary>("/crm/summary");
}

export function listCrmActivitiesApi(query?: CrmActivityListQuery) {
  return apiRequest<PaginatedResponse<CrmActivity>>(withQuery("/crm/activities", query));
}

export function listCrmLeadActivitiesApi(id: string, query?: CrmActivityListQuery) {
  return apiRequest<PaginatedResponse<CrmActivity>>(withQuery(`/crm/leads/${id}/activities`, query));
}

export function listConversationsApi(query?: ConversationListQuery) {
  return apiRequest<Conversation[] | PaginatedResponse<Conversation>>(withQuery("/conversations", query));
}

export function getConversationApi(id: string) {
  return apiRequest<Conversation>(`/conversations/${id}`);
}

export function listConversationActivitiesApi(id: string, query?: CrmActivityListQuery) {
  return apiRequest<PaginatedResponse<CrmActivity>>(withQuery(`/conversations/${id}/activities`, query));
}

export function listConversationMessagesApi(id: string) {
  return apiRequest<ConversationMessage[]>(`/conversations/${id}/messages`);
}

export function createConversationMessageApi(id: string, input: CreateConversationMessageInput) {
  return apiRequest<ConversationMessage>(`/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateConversationStatusApi(id: string, input: UpdateConversationStatusInput) {
  return apiRequest<Conversation>(`/conversations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createConversationFromCrmLeadApi(
  crmLeadId: string,
  input: CreateConversationFromCrmLeadInput = {},
) {
  return apiRequest<Conversation>(`/conversations/from-crm-lead/${crmLeadId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function withQuery(path: string, query?: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      if (value) params.set(key, "true");
      continue;
    }
    params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
