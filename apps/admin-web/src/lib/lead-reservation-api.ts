"use client";

import { apiRequest } from "@/lib/api";
import type {
  CreateLeadClaimInput,
  CreateReservationRequestInput,
  LeadClaim,
  LeadClaimConflict,
  ReservationRequest,
  ResolveLeadClaimConflictInput,
} from "@/types/lead-reservations";

export function createLeadClaimApi(input: CreateLeadClaimInput) {
  return apiRequest<LeadClaim>("/lead-claims", { method: "POST", body: JSON.stringify(input) });
}

export function listMyLeadClaimsApi() {
  return apiRequest<LeadClaim[]>("/lead-claims/my");
}

export function getLeadClaimApi(id: string) {
  return apiRequest<LeadClaim>(`/lead-claims/${id}`);
}

export function releaseLeadClaimApi(id: string) {
  return apiRequest<LeadClaim>(`/lead-claims/${id}/release`, { method: "PATCH" });
}

export function listLeadClaimConflictsApi() {
  return apiRequest<LeadClaimConflict[]>("/lead-claims/conflicts");
}

export function resolveLeadClaimConflictApi(id: string, input: ResolveLeadClaimConflictInput) {
  return apiRequest<LeadClaimConflict>(`/lead-claims/conflicts/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createReservationRequestApi(input: CreateReservationRequestInput) {
  return apiRequest<ReservationRequest>("/reservation-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listReservationRequestsApi() {
  return apiRequest<ReservationRequest[]>("/reservation-requests");
}

export function getReservationRequestApi(id: string) {
  return apiRequest<ReservationRequest>(`/reservation-requests/${id}`);
}

export function approveReservationRequestApi(id: string) {
  return apiRequest<ReservationRequest>(`/reservation-requests/${id}/approve`, { method: "PATCH" });
}

export function rejectReservationRequestApi(id: string, reason: string) {
  return apiRequest<ReservationRequest>(`/reservation-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export function cancelReservationRequestApi(id: string) {
  return apiRequest<ReservationRequest>(`/reservation-requests/${id}/cancel`, { method: "PATCH" });
}
