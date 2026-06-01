"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CrmLeadListQuery, CrmLeadStatus, PreferredContactMethod } from "@/types/admin-crm";

export function CrmLeadFilters({
  filters,
  onChange,
}: {
  filters: CrmLeadListQuery;
  onChange: (filters: CrmLeadListQuery) => void;
}) {
  function update(patch: Partial<CrmLeadListQuery>) {
    onChange({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        Status
        <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" value={filters.status ?? ""} onChange={(event) => update({ status: event.target.value as CrmLeadStatus | "" })}>
          <option value="">All</option>
          <option value="NEW">New</option>
          <option value="CLAIMED">Claimed</option>
          <option value="IN_CONVERSATION">In conversation</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="LOST">Lost</option>
          <option value="CONVERTED">Converted</option>
          <option value="SPAM">Spam</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        Contact
        <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" value={filters.preferredContactMethod ?? ""} onChange={(event) => update({ preferredContactMethod: event.target.value as PreferredContactMethod | "" })}>
          <option value="">All</option>
          <option value="CALL">Call</option>
          <option value="CHAT">Chat</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        Search
        <Input value={filters.search ?? ""} onChange={(event) => update({ search: event.target.value })} placeholder="Name, email, last4" />
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        From
        <Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => update({ dateFrom: event.target.value })} />
      </label>
      <label className="space-y-2 text-sm font-medium text-zinc-800">
        To
        <Input type="date" value={filters.dateTo ?? ""} onChange={(event) => update({ dateTo: event.target.value })} />
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={Boolean(filters.claimedOnly)} onChange={(event) => update({ claimedOnly: event.target.checked, unclaimedOnly: event.target.checked ? false : filters.unclaimedOnly })} />
          Claimed
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={Boolean(filters.unclaimedOnly)} onChange={(event) => update({ unclaimedOnly: event.target.checked, claimedOnly: event.target.checked ? false : filters.claimedOnly })} />
          Unclaimed
        </label>
        <Button className="bg-white text-zinc-950 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => onChange({ page: 1, pageSize: filters.pageSize ?? 20 })}>
          Reset
        </Button>
      </div>
    </div>
  );
}
