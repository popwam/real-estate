"use client";

import Link from "next/link";
import { ReservationStatusBadge } from "@/components/lead-reservations/badges";
import { ReservationActionDialog } from "@/components/lead-reservations/reservation-action-dialog";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ReservationRequest } from "@/types/lead-reservations";

export function ReservationRequestTable({
  requests,
  basePath,
  mode,
  onApprove,
  onReject,
  onCancel,
  isWorking,
  error,
}: {
  requests: ReservationRequest[];
  basePath: string;
  mode: "developer" | "brokerage";
  onApprove?: (id: string) => Promise<unknown>;
  onReject?: (id: string, reason: string) => Promise<unknown>;
  onCancel?: (id: string) => Promise<unknown>;
  isWorking?: boolean;
  error?: Error | null;
}) {
  return (
    <DataTable<ReservationRequest>
      columns={[
        { key: "status", header: "Status", cell: (row) => <ReservationStatusBadge status={row.status} /> },
        { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
        { key: "unit", header: "Unit", cell: (row) => row.unit?.unitNumber ?? row.unitId },
        { key: "broker", header: "Broker", cell: (row) => brokerLabel(row) },
        { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
        { key: "rejectionReason", header: "Rejection", cell: (row) => row.rejectionReason ?? "None" },
        {
          key: "actions",
          header: "Actions",
          cell: (row) => (
            <div className="flex flex-wrap gap-2">
              <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${basePath}/${row.id}`}>
                Open
              </Link>
              {mode === "developer" && row.status === "PENDING" && onApprove ? (
                <ReservationActionDialog
                  action="approve"
                  isPending={isWorking}
                  error={error}
                  trigger={<Button className="h-8 px-2">Approve</Button>}
                  onConfirm={() => onApprove(row.id)}
                />
              ) : null}
              {mode === "developer" && row.status === "PENDING" && onReject ? (
                <ReservationActionDialog
                  action="reject"
                  isPending={isWorking}
                  error={error}
                  trigger={<Button className="h-8 bg-red-600 px-2 hover:bg-red-700">Reject</Button>}
                  onConfirm={(input) => onReject(row.id, input.reason ?? "")}
                />
              ) : null}
              {mode === "brokerage" && row.status === "PENDING" && onCancel ? (
                <ReservationActionDialog
                  action="cancel"
                  isPending={isWorking}
                  error={error}
                  trigger={<Button className="h-8 bg-amber-600 px-2 hover:bg-amber-700">Cancel</Button>}
                  onConfirm={() => onCancel(row.id)}
                />
              ) : null}
            </div>
          ),
        },
      ]}
      data={requests}
      emptyTitle="No reservation requests"
      emptyDescription="Reservation workflow records will appear here."
    />
  );
}

export function brokerLabel(request: ReservationRequest) {
  const broker = request.broker;
  if (!broker) return request.brokerageId ?? request.brokerUserId;
  return [broker.firstName, broker.lastName].filter(Boolean).join(" ") || broker.email;
}
