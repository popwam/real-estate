"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConversationListQuery, ConversationStatus, ConversationType } from "@/types/admin-crm";

export function ConversationFilters({
  filters,
  onChange,
}: {
  filters: ConversationListQuery;
  onChange: (filters: ConversationListQuery) => void;
}) {
  function update(patch: Partial<ConversationListQuery>) {
    onChange({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        Status
        <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" value={filters.status ?? ""} onChange={(event) => update({ status: event.target.value as ConversationStatus | "" })}>
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        Type
        <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" value={filters.type ?? ""} onChange={(event) => update({ type: event.target.value as ConversationType | "" })}>
          <option value="">All</option>
          <option value="PUBLIC_LEAD">Public lead</option>
          <option value="DEAL_ROOM">Deal room</option>
          <option value="SUPPORT">Support</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        Search
        <Input value={filters.search ?? ""} onChange={(event) => update({ search: event.target.value })} placeholder="Lead, project, participant" />
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        From
        <Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => update({ dateFrom: event.target.value })} />
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        To
        <Input type="date" value={filters.dateTo ?? ""} onChange={(event) => update({ dateTo: event.target.value })} />
      </label>
      <div className="flex items-end">
        <Button className="bg-white text-zinc-950 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => onChange({ page: 1, pageSize: filters.pageSize ?? 20 })}>
          Reset
        </Button>
      </div>
    </div>
  );
}
