import { StatusBadge } from "@/components/status-badge";

export function VerificationStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
