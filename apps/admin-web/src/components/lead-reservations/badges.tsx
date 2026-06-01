import { StatusBadge } from "@/components/status-badge";

export function LeadClaimStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function ReservationStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
