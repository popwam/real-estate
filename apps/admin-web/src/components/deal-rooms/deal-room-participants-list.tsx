"use client";

import { UsersRound } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { DealRoomParticipant } from "@/types/deal-rooms";
import { useI18n } from "@/i18n";

export function DealRoomParticipantsList({ participants = [] }: { participants?: DealRoomParticipant[] }) {
  const { t } = useI18n();

  if (!participants.length) return <div className="ui-empty-state"><UsersRound className="h-7 w-7" aria-hidden="true" /><p>{t("adminSweep.no.participants.have.been.added.070cf384")}</p></div>;
  return <ul className="space-y-3">{participants.map((participant) => <li key={participant.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-[var(--color-text)]">{participantDisplay(participant)}</p><p className="mt-1 text-xs capitalize text-[var(--color-text-muted)]">{participant.role.replaceAll("_", " ").toLowerCase()}</p></div><span className="ui-badge capitalize">{participant.status.toLowerCase()}</span></div>{participant.joinedAt || participant.invitedAt ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">{participant.joinedAt ? `Joined ${formatDate(participant.joinedAt)}` : `Invited ${formatDate(participant.invitedAt)}`}</p> : null}</li>)}</ul>;
}
function participantDisplay(participant: DealRoomParticipant) { if (participant.user) return [participant.user.firstName, participant.user.lastName].filter(Boolean).join(" ") || participant.user.email; if (participant.client) return participant.client.name ?? "Client"; if (participant.organization) return participant.organization.name; return participant.role.replaceAll("_", " ").toLowerCase(); }
