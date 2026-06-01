"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDealRoomParticipantApi,
  createDealRoomFromReservationApi,
  createDealRoomMessageApi,
  getDealRoomApi,
  inviteDealRoomClientApi,
  listDealRoomMessagesApi,
  listDealRoomsApi,
  updateDealRoomStatusApi,
} from "@/lib/deal-room-api";
import type {
  AddDealRoomParticipantInput,
  CreateDealRoomMessageInput,
  DealRoomStatus,
} from "@/types/deal-rooms";

const dealRoomsKey = ["deal-rooms"] as const;

export function useDealRooms() {
  return useQuery({ queryKey: dealRoomsKey, queryFn: listDealRoomsApi });
}

export function useDealRoom(id: string) {
  return useQuery({
    queryKey: [...dealRoomsKey, id],
    queryFn: () => getDealRoomApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateDealRoomFromReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationRequestId: string) => createDealRoomFromReservationApi(reservationRequestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealRoomsKey });
      void qc.invalidateQueries({ queryKey: ["reservation-requests"] });
    },
  });
}

export function useAddDealRoomParticipant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddDealRoomParticipantInput) => addDealRoomParticipantApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...dealRoomsKey, id] }),
  });
}

export function useInviteDealRoomClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inviteDealRoomClientApi(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...dealRoomsKey, id] }),
  });
}

export function useUpdateDealRoomStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: DealRoomStatus) => updateDealRoomStatusApi(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealRoomsKey });
      void qc.invalidateQueries({ queryKey: [...dealRoomsKey, id] });
      void qc.invalidateQueries({ queryKey: [...dealRoomsKey, id, "messages"] });
    },
  });
}

export function useDealRoomMessages(id: string) {
  return useQuery({
    queryKey: [...dealRoomsKey, id, "messages"],
    queryFn: () => listDealRoomMessagesApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateDealRoomMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDealRoomMessageInput) => createDealRoomMessageApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...dealRoomsKey, id, "messages"] }),
  });
}
