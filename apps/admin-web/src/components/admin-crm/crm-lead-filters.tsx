"use client";

import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CrmLeadListQuery, CrmLeadStatus, PreferredContactMethod } from "@/types/admin-crm";

export function CrmLeadFilters({ filters, onChange }: { filters: CrmLeadListQuery; onChange: (filters: CrmLeadListQuery) => void }) {
  function update(patch: Partial<CrmLeadListQuery>) {
    onChange({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <FilterLabel label="Status"><select className="ui-input" value={filters.status ?? ""} onChange={(event) => update({ status: event.target.value as CrmLeadStatus | "" })}><option value="">All statuses</option>{["NEW", "CLAIMED", "IN_CONVERSATION", "QUALIFIED", "LOST", "CONVERTED", "SPAM"].map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></FilterLabel>
      <FilterLabel label="Preferred contact"><select className="ui-input" value={filters.preferredContactMethod ?? ""} onChange={(event) => update({ preferredContactMethod: event.target.value as PreferredContactMethod | "" })}><option value="">All methods</option><option value="CALL">Call</option><option value="CHAT">Chat</option><option value="WHATSAPP">WhatsApp</option></select></FilterLabel>
      <FilterLabel label="Search"><Input value={filters.search ?? ""} onChange={(event) => update({ search: event.target.value })} placeholder="Name, email, phone" /></FilterLabel>
      <FilterLabel label="Created from"><Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => update({ dateFrom: event.target.value })} /></FilterLabel>
      <FilterLabel label="Created to"><Input type="date" value={filters.dateTo ?? ""} onChange={(event) => update({ dateTo: event.target.value })} /></FilterLabel>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-h-10 items-center gap-2 text-sm text-[var(--color-foreground)]"><input className="accent-[var(--color-accent)]" type="checkbox" checked={Boolean(filters.claimedOnly)} onChange={(event) => update({ claimedOnly: event.target.checked, unclaimedOnly: event.target.checked ? false : filters.unclaimedOnly })} />Claimed</label>
        <label className="flex min-h-10 items-center gap-2 text-sm text-[var(--color-foreground)]"><input className="accent-[var(--color-accent)]" type="checkbox" checked={Boolean(filters.unclaimedOnly)} onChange={(event) => update({ unclaimedOnly: event.target.checked, claimedOnly: event.target.checked ? false : filters.claimedOnly })} />Unclaimed</label>
        <button type="button" className="ui-button ui-button-secondary" onClick={() => onChange({ page: 1, pageSize: filters.pageSize ?? 20 })}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</button>
      </div>
    </div>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{label}{children}</label>;
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
