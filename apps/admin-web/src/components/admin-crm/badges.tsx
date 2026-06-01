import { cn } from "@/lib/utils";
import type { ConversationStatus, CrmLeadStatus, PreferredContactMethod } from "@/types/admin-crm";

export function CrmLeadStatusBadge({ status }: { status: CrmLeadStatus }) {
  const className = {
    NEW: "border-blue-200 bg-blue-50 text-blue-700",
    CLAIMED: "border-amber-200 bg-amber-50 text-amber-700",
    IN_CONVERSATION: "border-sky-200 bg-sky-50 text-sky-700",
    QUALIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    LOST: "border-zinc-200 bg-zinc-50 text-zinc-700",
    CONVERTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SPAM: "border-red-200 bg-red-50 text-red-700",
  } as const;

  return <Badge className={className[status]} label={status.replaceAll("_", " ")} />;
}

export function PreferredContactMethodBadge({ method }: { method?: PreferredContactMethod | null }) {
  const label = method ?? "CALL";
  const className =
    label === "WHATSAPP"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : label === "CHAT"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-zinc-200 bg-zinc-50 text-zinc-700";
  return <Badge className={className} label={label} />;
}

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  const className = {
    OPEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CLOSED: "border-zinc-200 bg-zinc-50 text-zinc-700",
    ARCHIVED: "border-amber-200 bg-amber-50 text-amber-700",
  } as const;

  return <Badge className={className[status]} label={status} />;
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
