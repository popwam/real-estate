import { StatusBadge } from "@/components/status-badge";

export function DealRoomStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
