import { cn } from "@/lib/utils";
import type { ImportJobStatus, ImportRowStatus } from "@/types/admin-import-export";

export function ImportJobStatusBadge({ status }: { status: ImportJobStatus }) {
  const className = {
    DRAFT: "border-zinc-200 bg-zinc-50 text-zinc-700",
    VALIDATING: "border-blue-200 bg-blue-50 text-blue-700",
    READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
    COMMITTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FAILED: "border-red-200 bg-red-50 text-red-700",
    CANCELLED: "border-amber-200 bg-amber-50 text-amber-700",
  } as const;
  return <Badge className={className[status]} label={status} />;
}

export function ImportRowStatusBadge({ status }: { status: ImportRowStatus }) {
  const className = {
    VALID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    INVALID: "border-red-200 bg-red-50 text-red-700",
    SKIPPED: "border-amber-200 bg-amber-50 text-amber-700",
    COMMITTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  } as const;
  return <Badge className={className[status]} label={status} />;
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", className)}>
      {label.replaceAll("_", " ")}
    </span>
  );
}
