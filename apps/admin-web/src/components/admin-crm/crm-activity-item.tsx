import { CrmActivityTypeBadge } from "@/components/admin-crm/crm-activity-type-badge";
import { formatDate } from "@/lib/format";
import type { CrmActivity } from "@/types/admin-crm";

export function CrmActivityItem({ activity }: { activity: CrmActivity }) {
  const metadata = safeMetadata(activity.metadata);
  const actor = activity.publicActorName ?? activity.actorRole ?? activity.actorOrganization?.name ?? activity.actorUser?.name;

  return (
    <li className="relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ps-6 before:absolute before:inset-y-4 before:start-0 before:w-1 before:rounded-e before:bg-[var(--color-accent)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <CrmActivityTypeBadge type={activity.type} />
          <div>
            <p className="font-medium text-[var(--color-foreground)]">{activity.title}</p>
            {activity.body ? <p className="mt-1 text-sm text-[var(--color-muted)]">{activity.body}</p> : null}
          </div>
        </div>
        <time className="text-sm text-[var(--color-muted)]">{formatDate(activity.createdAt)}</time>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
        {actor ? <span>Actor: {actor}</span> : null}
        {activity.crmLead?.client?.name ? <span>Lead: {activity.crmLead.client.name}</span> : null}
        {activity.crmLead?.project?.name ? <span>Project: {activity.crmLead.project.name}</span> : null}
        {activity.conversation?.type ? <span>Conversation: {activity.conversation.type.replaceAll("_", " ")}</span> : null}
      </div>
      {metadata ? <dl className="mt-3 grid gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 sm:grid-cols-2">{Object.entries(metadata).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{formatLabel(key)}</dt><dd className="mt-1 text-xs text-[var(--color-foreground)]">{value == null ? "Not set" : String(value)}</dd></div>)}</dl> : null}
    </li>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
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
