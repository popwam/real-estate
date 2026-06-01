import { StatusBadge } from "@/components/status-badge";

export function OrganizationStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
