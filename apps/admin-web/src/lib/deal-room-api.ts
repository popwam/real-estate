"use client";

import { apiRequest } from "@/lib/api";
import type {
  AddDealRoomParticipantInput,
  ClientInviteResponse,
  CreateDealRoomMessageInput,
  DealRoom,
  DealRoomMessage,
  DealRoomParticipant,
  DealRoomStatus,
} from "@/types/deal-rooms";

export function listDealRoomsApi() {
  return apiRequest<DealRoom[]>("/deal-rooms");
}

export function getDealRoomApi(id: string) {
  return apiRequest<DealRoom>(`/deal-rooms/${id}`);
}

export function createDealRoomFromReservationApi(reservationRequestId: string) {
  return apiRequest<DealRoom>(`/deal-rooms/from-reservation/${reservationRequestId}`, {
    method: "POST",
  });
}

export function addDealRoomParticipantApi(id: string, input: AddDealRoomParticipantInput) {
  return apiRequest<DealRoomParticipant>(`/deal-rooms/${id}/participants`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function inviteDealRoomClientApi(id: string) {
  return apiRequest<ClientInviteResponse>(`/deal-rooms/${id}/invite-client`, { method: "POST" });
}

export function updateDealRoomStatusApi(id: string, status: DealRoomStatus) {
  return apiRequest<DealRoom>(`/deal-rooms/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listDealRoomMessagesApi(id: string) {
  return apiRequest<DealRoomMessage[]>(`/deal-rooms/${id}/messages`);
}

export function createDealRoomMessageApi(id: string, input: CreateDealRoomMessageInput) {
  return apiRequest<DealRoomMessage>(`/deal-rooms/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
