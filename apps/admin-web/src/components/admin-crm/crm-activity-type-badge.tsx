import { cn } from "@/lib/utils";
import type { CrmActivityType } from "@/types/admin-crm";

const activityClassName: Record<CrmActivityType, string> = {
  LEAD_CREATED: "border-blue-200 bg-blue-50 text-blue-700",
  LEAD_CONVERTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  LEAD_CLAIMED: "border-amber-200 bg-amber-50 text-amber-700",
  LEAD_STATUS_CHANGED: "border-sky-200 bg-sky-50 text-sky-700",
  CONVERSATION_CREATED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  CONVERSATION_STATUS_CHANGED: "border-violet-200 bg-violet-50 text-violet-700",
  MESSAGE_SENT: "border-zinc-200 bg-zinc-50 text-zinc-700",
  PUBLIC_MESSAGE_SENT: "border-teal-200 bg-teal-50 text-teal-700",
  NOTE_ADDED: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  LEAD_STAGE_CHANGED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  TASK_CREATED: "border-purple-200 bg-purple-50 text-purple-700",
  TASK_COMPLETED: "border-green-200 bg-green-50 text-green-700",
};

export function CrmActivityTypeBadge({ type }: { type: CrmActivityType }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", activityClassName[type])}>
      {type.replaceAll("_", " ")}
    </span>
  );
}
