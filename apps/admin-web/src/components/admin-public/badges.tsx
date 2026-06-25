import { cn } from "@/lib/utils";
import type { DomainVerificationStatus, PublicLeadStatus } from "@/types/admin-public";

const leadClasses: Record<PublicLeadStatus, string> = {
  NEW: "border-[color-mix(in_srgb,var(--color-info)_35%,var(--color-border))] bg-[var(--color-info-soft)] text-[var(--color-info)]",
  REVIEWED: "border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border))] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  CONVERTED: "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  SPAM: "border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-border))] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const domainClasses: Record<DomainVerificationStatus, string> = {
  PENDING: "border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border))] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  VERIFIED: "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  FAILED: "border-[color-mix(in_srgb,var(--color-danger)_35%,var(--color-border))] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function PublicLeadStatusBadge({ status }: { status: PublicLeadStatus }) {
  return <Badge className={leadClasses[status]}>{status}</Badge>;
}

export function DomainStatusBadge({ status }: { status: DomainVerificationStatus }) {
  return <Badge className={domainClasses[status]}>{status}</Badge>;
}

function Badge({ className, children }: { className: string; children: string }) {
  return (
    <span className={cn("inline-flex rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-medium", className)}>
      {children.replace("_", " ")}
    </span>
  );
}
