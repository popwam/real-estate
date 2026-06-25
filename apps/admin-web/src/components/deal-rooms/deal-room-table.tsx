"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarClock, Home, MessageSquareText, UsersRound } from "lucide-react";
import { DealRoomStatusBadge } from "@/components/deal-rooms/badges";
import { formatDate } from "@/lib/format";
import type { DealRoom } from "@/types/deal-rooms";

export function DealRoomTable({ rooms, basePath }: { rooms: DealRoom[]; basePath: string }) {
  if (!rooms.length) return <div className="ui-empty-state"><MessageSquareText className="h-8 w-8" aria-hidden="true" /><h3>No deal rooms yet</h3><p>Approved reservations can move here for negotiation and deal handoff.</p></div>;
  return <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{rooms.map((room) => (
    <article key={room.id} className="ui-card flex min-w-0 flex-col p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Negotiation workspace</p><h3 className="mt-1 truncate text-base font-semibold text-[var(--color-text)]">{room.project?.name ?? "Deal room"}</h3></div><DealRoomStatusBadge status={room.status} /></div>
      <dl className="mt-5 grid gap-3 text-sm">
        <Fact icon={Home} label="Unit" value={room.unit?.unitNumber ?? "Unit details unavailable"} />
        <Fact icon={Building2} label="Parties" value={`${room.developer?.name ?? "Developer"} · ${room.brokerage?.name ?? "Individual broker"}`} />
        <Fact icon={UsersRound} label="Participants" value={room.participants?.length !== undefined ? `${room.participants.length} participant${room.participants.length === 1 ? "" : "s"}` : clientParticipantLabel(room)} />
        <Fact icon={MessageSquareText} label="Messages" value={room._count?.messages !== undefined ? `${room._count.messages} message${room._count.messages === 1 ? "" : "s"}` : "Open workspace for activity"} />
        <Fact icon={CalendarClock} label="Last activity" value={formatDate(room.updatedAt)} />
      </dl>
      <div className="mt-auto pt-5"><Link className="ui-button ui-button-secondary" href={`${basePath}/${room.id}`}>Open workspace <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    </article>
  ))}</div>;
}

function Fact({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-[var(--color-text-muted)]">{label}</dt><dd className="truncate font-medium text-[var(--color-text)]">{value}</dd></div></div>; }
export function brokerName(room: DealRoom) { if (!room.broker) return "Assigned broker"; return [room.broker.firstName, room.broker.lastName].filter(Boolean).join(" ") || room.broker.email; }
export function clientParticipantLabel(room: DealRoom) { const participant = room.participants?.find((item) => item.role === "CLIENT"); if (!participant) return room.clientInvitedAt ? "Client invited" : "Client not invited"; return `${participant.client?.name ?? "Client"} · ${participant.status.toLowerCase()}`; }
