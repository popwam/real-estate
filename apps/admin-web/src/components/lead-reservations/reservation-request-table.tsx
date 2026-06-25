"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarClock, Home, UserRound } from "lucide-react";
import { ReservationStatusBadge } from "@/components/lead-reservations/badges";
import { ReservationActionDialog } from "@/components/lead-reservations/reservation-action-dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ReservationRequest } from "@/types/lead-reservations";

export function ReservationRequestTable({ requests, basePath, mode, onApprove, onReject, onCancel, isWorking, error }: {
  requests: ReservationRequest[];
  basePath: string;
  mode: "developer" | "brokerage";
  onApprove?: (id: string) => Promise<unknown>;
  onReject?: (id: string, reason: string) => Promise<unknown>;
  onCancel?: (id: string) => Promise<unknown>;
  isWorking?: boolean;
  error?: Error | null;
}) {
  if (!requests.length) {
    return <div className="ui-empty-state"><CalendarClock className="h-8 w-8" aria-hidden="true" /><h3>No reservation requests</h3><p>{mode === "developer" ? "New broker requests will appear here for review." : "Requests you submit to developers will appear here."}</p></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {requests.map((request) => (
        <article key={request.id} className="ui-card flex min-w-0 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Reservation request</p>
              <h3 className="mt-1 truncate text-base font-semibold text-[var(--color-text)]">{request.project?.name ?? "Project reservation"}</h3>
            </div>
            <ReservationStatusBadge status={request.status} />
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <Fact icon={Home} label="Unit" value={request.unit?.unitNumber ?? "Unit details unavailable"} />
            <Fact icon={UserRound} label={mode === "developer" ? "Broker" : "Client"} value={mode === "developer" ? brokerLabel(request) : request.leadClaim?.client?.name ?? "Client protected by claim"} />
            <Fact icon={Building2} label={mode === "developer" ? "Brokerage" : "Developer"} value={mode === "developer" ? request.brokerageId ?? "Individual broker" : request.project?.name ?? "Project developer"} />
            <Fact icon={CalendarClock} label="Updated" value={formatDate(request.updatedAt)} />
          </dl>
          {request.rejectionReason ? <div className="ui-feedback ui-feedback-error mt-4 text-sm"><strong>Developer response:</strong> {request.rejectionReason}</div> : null}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <Link className="ui-button ui-button-secondary" href={`${basePath}/${request.id}`}>Review request <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            {mode === "developer" && request.status === "PENDING" && onApprove ? <ReservationActionDialog action="approve" isPending={isWorking} error={error} trigger={<Button>Approve</Button>} onConfirm={() => onApprove(request.id)} /> : null}
            {mode === "developer" && request.status === "PENDING" && onReject ? <ReservationActionDialog action="reject" isPending={isWorking} error={error} trigger={<Button className="bg-[var(--color-danger)] text-white hover:opacity-90">Reject</Button>} onConfirm={(input) => onReject(request.id, input.reason ?? "")} /> : null}
            {mode === "brokerage" && request.status === "PENDING" && onCancel ? <ReservationActionDialog action="cancel" isPending={isWorking} error={error} trigger={<Button className="ui-button-secondary">Cancel</Button>} onConfirm={() => onCancel(request.id)} /> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-[var(--color-text-muted)]">{label}</dt><dd className="truncate font-medium text-[var(--color-text)]">{value}</dd></div></div>;
}

export function brokerLabel(request: ReservationRequest) {
  const broker = request.broker;
  if (!broker) return request.brokerageId ?? "Assigned broker";
  return [broker.firstName, broker.lastName].filter(Boolean).join(" ") || broker.email;
}
