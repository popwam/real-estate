import { StatusBadge } from "@/components/status-badge";

export function ProjectStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function ProjectVisibilityBadge({ visibility }: { visibility: string }) {
  return <StatusBadge status={visibility} />;
}

export function UnitStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function UnitVisibilityBadge({ visibility }: { visibility: string }) {
  return <StatusBadge status={visibility} />;
}

export function AgreementStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function BrokerAccessLevelBadge({ accessLevel }: { accessLevel: string }) {
  return <StatusBadge status={accessLevel} />;
}
