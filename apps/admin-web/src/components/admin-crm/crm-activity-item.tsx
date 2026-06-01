import { CrmActivityTypeBadge } from "@/components/admin-crm/crm-activity-type-badge";
import { formatDate } from "@/lib/format";
import type { CrmActivity } from "@/types/admin-crm";

export function CrmActivityItem({ activity }: { activity: CrmActivity }) {
  const metadata = safeMetadata(activity.metadata);
  const actor = activity.publicActorName ?? activity.actorRole ?? activity.actorOrganization?.name ?? activity.actorUser?.name;

  return (
    <li className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <CrmActivityTypeBadge type={activity.type} />
          <div>
            <p className="font-medium text-zinc-950">{activity.title}</p>
            {activity.body ? <p className="mt-1 text-sm text-zinc-600">{activity.body}</p> : null}
          </div>
        </div>
        <time className="text-sm text-zinc-500">{formatDate(activity.createdAt)}</time>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
        {actor ? <span>Actor: {actor}</span> : null}
        {activity.crmLead?.client?.name ? <span>Lead: {activity.crmLead.client.name}</span> : null}
        {activity.crmLead?.project?.name ? <span>Project: {activity.crmLead.project.name}</span> : null}
        {activity.conversation?.type ? <span>Conversation: {activity.conversation.type.replaceAll("_", " ")}</span> : null}
      </div>
      {metadata ? (
        <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-zinc-950 p-3 text-xs leading-5 text-zinc-50">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      ) : null}
    </li>
  );
}

function safeMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) return null;
  const entries = Object.entries(metadata)
    .filter(([key, value]) => {
      const lower = key.toLowerCase();
      if (lower === "id" || lower.endsWith("id") || lower.includes("token")) return false;
      return ["string", "number", "boolean"].includes(typeof value) || value === null;
    })
    .slice(0, 12);
  return entries.length ? Object.fromEntries(entries) : null;
}
