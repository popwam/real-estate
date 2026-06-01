"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveCommissionApi,
  approveDealApi,
  cancelDealApi,
  createCommissionRuleApi,
  createDealFromRoomApi,
  getCommissionApi,
  getCommissionRuleApi,
  getDealApi,
  listCommissionRulesApi,
  listCommissionsApi,
  listDealsApi,
  rejectCommissionApi,
  updateCommissionRuleApi,
} from "@/lib/commercial-api";
import type { CancelDealInput, CommissionRuleInput, CreateDealFromRoomInput } from "@/types/commercial";

const dealsKey = ["commercial", "deals"] as const;
const commissionRulesKey = ["commercial", "commission-rules"] as const;
const commissionsKey = ["commercial", "commissions"] as const;

export function useDeals() {
  return useQuery({ queryKey: dealsKey, queryFn: listDealsApi });
}

export function useDeal(id: string) {
  return useQuery({ queryKey: [...dealsKey, id], queryFn: () => getDealApi(id), enabled: Boolean(id) });
}

export function useCreateDealFromRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDealFromRoomInput) => createDealFromRoomApi(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealsKey });
      void qc.invalidateQueries({ queryKey: ["deal-rooms"] });
      void qc.invalidateQueries({ queryKey: commissionsKey });
    },
  });
}

export function useApproveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveDealApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: dealsKey });
      void qc.invalidateQueries({ queryKey: [...dealsKey, id] });
    },
  });
}

export function useCancelDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelDealInput }) => cancelDealApi(id, input),
    onSuccess: (_data, value) => {
      void qc.invalidateQueries({ queryKey: dealsKey });
      void qc.invalidateQueries({ queryKey: [...dealsKey, value.id] });
    },
  });
}

export function useCommissionRules() {
  return useQuery({ queryKey: commissionRulesKey, queryFn: listCommissionRulesApi });
}

export function useCommissionRule(id: string) {
  return useQuery({
    queryKey: [...commissionRulesKey, id],
    queryFn: () => getCommissionRuleApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CommissionRuleInput) => createCommissionRuleApi(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: commissionRulesKey }),
  });
}

export function useUpdateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CommissionRuleInput> }) =>
      updateCommissionRuleApi(id, input),
    onSuccess: (_data, value) => {
      void qc.invalidateQueries({ queryKey: commissionRulesKey });
      void qc.invalidateQueries({ queryKey: [...commissionRulesKey, value.id] });
    },
  });
}

export function useCommissions() {
  return useQuery({ queryKey: commissionsKey, queryFn: listCommissionsApi });
}

export function useCommission(id: string) {
  return useQuery({ queryKey: [...commissionsKey, id], queryFn: () => getCommissionApi(id), enabled: Boolean(id) });
}

export function useApproveCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveCommissionApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: commissionsKey });
      void qc.invalidateQueries({ queryKey: [...commissionsKey, id] });
    },
  });
}

export function useRejectCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectCommissionApi(id, reason),
    onSuccess: (_data, value) => {
      void qc.invalidateQueries({ queryKey: commissionsKey });
      void qc.invalidateQueries({ queryKey: [...commissionsKey, value.id] });
    },
  });
}
