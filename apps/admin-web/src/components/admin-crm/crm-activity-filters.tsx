"use client";

import type { CrmActivityListQuery, CrmActivityType } from "@/types/admin-crm";

const activityTypes: CrmActivityType[] = [
  "LEAD_CREATED",
  "LEAD_CONVERTED",
  "LEAD_CLAIMED",
  "LEAD_STATUS_CHANGED",
  "CONVERSATION_CREATED",
  "CONVERSATION_STATUS_CHANGED",
  "MESSAGE_SENT",
  "PUBLIC_MESSAGE_SENT",
  "NOTE_ADDED",
];

export function CrmActivityFilters({
  filters,
  onChange,
}: {
  filters: CrmActivityListQuery;
  onChange: (filters: CrmActivityListQuery) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="space-y-1 text-sm">
        <span className="font-medium text-zinc-700">Type</span>
        <select
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          value={filters.type ?? ""}
          onChange={(event) => onChange({ ...filters, page: 1, type: event.target.value as CrmActivityType | "" })}
        >
          <option value="">All activity</option>
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-zinc-700">From</span>
        <input
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(event) => onChange({ ...filters, page: 1, dateFrom: event.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-zinc-700">To</span>
        <input
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(event) => onChange({ ...filters, page: 1, dateTo: event.target.value })}
        />
      </label>
    </div>
  );
}
