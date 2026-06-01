"use client";

import { LoadingState } from "@/components/loading-state";
import { useOperationActivities } from "@/hooks/use-admin-operations";
import { formatDate } from "@/lib/format";

export function OperationsActivityTimeline({ path, queryKey }: { path: string; queryKey: string }) {
  const { data, isLoading, error } = useOperationActivities(queryKey, path);

  if (isLoading) return <LoadingState label="Loading operations activity" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;

  const items = data?.items ?? [];
  if (!items.length) return <p className="text-sm text-zinc-500">No operations activity recorded yet.</p>;

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li className="rounded-md border border-zinc-200 p-4 text-sm" key={item.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">{item.module}</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{item.action}</span>
            <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
          </div>
          <p className="mt-2 font-medium text-zinc-950">{item.title}</p>
          {item.body ? <p className="mt-1 text-zinc-600">{item.body}</p> : null}
          <p className="mt-1 text-xs text-zinc-500">{item.entityType}{item.entityId ? ` · ${item.entityId}` : ""}</p>
        </li>
      ))}
    </ol>
  );
}
