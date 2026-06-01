import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  UNDER_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  DRAFT: "border-zinc-200 bg-zinc-50 text-zinc-700",
  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
  REVOKED: "border-red-200 bg-red-50 text-red-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClasses[status] ?? "border-zinc-200 bg-zinc-50 text-zinc-700",
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
