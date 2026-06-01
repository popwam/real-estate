import { cn } from "@/lib/utils";
import type { DomainVerificationStatus, PublicLeadStatus } from "@/types/admin-public";

const leadClasses: Record<PublicLeadStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 ring-blue-200",
  REVIEWED: "bg-amber-50 text-amber-700 ring-amber-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SPAM: "bg-red-50 text-red-700 ring-red-200",
};

const domainClasses: Record<DomainVerificationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
};

export function PublicLeadStatusBadge({ status }: { status: PublicLeadStatus }) {
  return <Badge className={leadClasses[status]}>{status}</Badge>;
}

export function DomainStatusBadge({ status }: { status: DomainVerificationStatus }) {
  return <Badge className={domainClasses[status]}>{status}</Badge>;
}

function Badge({ className, children }: { className: string; children: string }) {
  return (
    <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", className)}>
      {children.replace("_", " ")}
    </span>
  );
}
