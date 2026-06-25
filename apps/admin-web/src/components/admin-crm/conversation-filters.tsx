"use client";

import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ConversationListQuery, ConversationStatus, ConversationType } from "@/types/admin-crm";

export function ConversationFilters({ filters, onChange }: { filters: ConversationListQuery; onChange: (filters: ConversationListQuery) => void }) {
  function update(patch: Partial<ConversationListQuery>) { onChange({ ...filters, ...patch, page: patch.page ?? 1 }); }
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><Filter label="Status"><select className="ui-input" value={filters.status ?? ""} onChange={(event) => update({ status: event.target.value as ConversationStatus | "" })}><option value="">All statuses</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option><option value="ARCHIVED">Archived</option></select></Filter><Filter label="Type"><select className="ui-input" value={filters.type ?? ""} onChange={(event) => update({ type: event.target.value as ConversationType | "" })}><option value="">All types</option><option value="PUBLIC_LEAD">Public lead</option><option value="DEAL_ROOM">Deal room</option><option value="SUPPORT">Support</option></select></Filter><Filter label="Search"><Input value={filters.search ?? ""} onChange={(event) => update({ search: event.target.value })} placeholder="Lead, project, participant" /></Filter><Filter label="Updated from"><Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => update({ dateFrom: event.target.value })} /></Filter><Filter label="Updated to"><Input type="date" value={filters.dateTo ?? ""} onChange={(event) => update({ dateTo: event.target.value })} /></Filter><div className="flex items-end"><button type="button" className="ui-button ui-button-secondary" onClick={() => onChange({ page: 1, pageSize: filters.pageSize ?? 20 })}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset filters</button></div></div>;
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{label}{children}</label>; }
