"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveReservationRequestApi,
  cancelReservationRequestApi,
  createLeadClaimApi,
  createReservationRequestApi,
  getLeadClaimApi,
  getReservationRequestApi,
  listLeadClaimConflictsApi,
  listMyLeadClaimsApi,
  listReservationRequestsApi,
  rejectReservationRequestApi,
  releaseLeadClaimApi,
  resolveLeadClaimConflictApi,
} from "@/lib/lead-reservation-api";
import type {
  CreateLeadClaimInput,
  CreateReservationRequestInput,
  ResolveLeadClaimConflictInput,
} from "@/types/lead-reservations";

const leadClaimsKey = ["lead-claims"] as const;
const reservationsKey = ["reservation-requests"] as const;
const conflictsKey = ["lead-claim-conflicts"] as const;

export function useCreateLeadClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadClaimInput) => createLeadClaimApi(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: leadClaimsKey }),
  });
}

export function useMyLeadClaims() {
  return useQuery({ queryKey: [...leadClaimsKey, "my"], queryFn: listMyLeadClaimsApi });
}

export function useLeadClaim(id: string) {
  return useQuery({
    queryKey: [...leadClaimsKey, id],
    queryFn: () => getLeadClaimApi(id),
    enabled: Boolean(id),
  });
}

export function useReleaseLeadClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releaseLeadClaimApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: leadClaimsKey });
      void qc.invalidateQueries({ queryKey: [...leadClaimsKey, id] });
    },
  });
}

export function useLeadClaimConflicts() {
  return useQuery({ queryKey: conflictsKey, queryFn: listLeadClaimConflictsApi });
}

export function useResolveLeadClaimConflict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ResolveLeadClaimConflictInput }) =>
      resolveLeadClaimConflictApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: conflictsKey }),
  });
}

export function useCreateReservationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservationRequestInput) => createReservationRequestApi(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: reservationsKey }),
  });
}

export function useReservationRequests() {
  return useQuery({ queryKey: reservationsKey, queryFn: listReservationRequestsApi });
}

export function useReservationRequest(id: string) {
  return useQuery({
    queryKey: [...reservationsKey, id],
    queryFn: () => getReservationRequestApi(id),
    enabled: Boolean(id),
  });
}

export function useApproveReservationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveReservationRequestApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: reservationsKey });
      void qc.invalidateQueries({ queryKey: [...reservationsKey, id] });
    },
  });
}

export function useRejectReservationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectReservationRequestApi(id, reason),
    onSuccess: (_data, value) => {
      void qc.invalidateQueries({ queryKey: reservationsKey });
      void qc.invalidateQueries({ queryKey: [...reservationsKey, value.id] });
    },
  });
}

export function useCancelReservationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelReservationRequestApi(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: reservationsKey });
      void qc.invalidateQueries({ queryKey: [...reservationsKey, id] });
    },
  });
}
