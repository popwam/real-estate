"use client";

import { apiRequest } from "@/lib/api";
import type {
  CancelDealInput,
  CommissionEntry,
  CommissionRule,
  CommissionRuleInput,
  CreateDealFromRoomInput,
  Deal,
} from "@/types/commercial";

export function listDealsApi() {
  return apiRequest<Deal[]>("/deals");
}

export function getDealApi(id: string) {
  return apiRequest<Deal>(`/deals/${id}`);
}

export function createDealFromRoomApi(input: CreateDealFromRoomInput) {
  const { dealRoomId, ...body } = input;
  return apiRequest<Deal>(`/deals/from-deal-room/${dealRoomId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function approveDealApi(id: string) {
  return apiRequest<Deal>(`/deals/${id}/approve`, { method: "PATCH" });
}

export function cancelDealApi(id: string, input: CancelDealInput) {
  return apiRequest<Deal>(`/deals/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listCommissionRulesApi() {
  return apiRequest<CommissionRule[]>("/commission-rules");
}

export function getCommissionRuleApi(id: string) {
  return apiRequest<CommissionRule>(`/commission-rules/${id}`);
}

export function createCommissionRuleApi(input: CommissionRuleInput) {
  return apiRequest<CommissionRule>("/commission-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCommissionRuleApi(id: string, input: Partial<CommissionRuleInput>) {
  return apiRequest<CommissionRule>(`/commission-rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listCommissionsApi() {
  return apiRequest<CommissionEntry[]>("/commissions");
}

export function getCommissionApi(id: string) {
  return apiRequest<CommissionEntry>(`/commissions/${id}`);
}

export function approveCommissionApi(id: string) {
  return apiRequest<CommissionEntry>(`/commissions/${id}/approve`, { method: "PATCH" });
}

export function rejectCommissionApi(id: string, reason: string) {
  return apiRequest<CommissionEntry>(`/commissions/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}
