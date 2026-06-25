"use client";
import { useParams } from "next/navigation";
import { ReservationRequestDetailView } from "@/components/lead-reservations/reservation-request-detail-view";
export default function BrokerageReservationRequestDetailPage() { const { id } = useParams<{ id: string }>(); return <ReservationRequestDetailView id={id} mode="brokerage" />; }
