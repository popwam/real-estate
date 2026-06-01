import { StatusBadge } from "@/components/status-badge";

export function DealStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function CommissionStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
