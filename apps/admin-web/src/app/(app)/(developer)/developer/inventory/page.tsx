"use client";

import { useState } from "react";
import { UnitStatusBadge, UnitVisibilityBadge } from "@/components/developer/badges";
import { InventoryUnitForm } from "@/components/developer/inventory-unit-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
import { useCreateInventoryUnit, useInventoryUnits, useProjects, useUpdateInventoryUnit } from "@/hooks/use-developer";
import type { InventoryUnit } from "@/types/developer";

export default function DeveloperInventoryPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [editing, setEditing] = useState<InventoryUnit | undefined>();
  const { data: projects = [] } = useProjects();
  const { data = [], isLoading, error } = useInventoryUnits(filters);
  const create = useCreateInventoryUnit();
  const update = useUpdateInventoryUnit();

  return (
    <>
      <PageHeader title="Inventory" description="Manage all inventory units across developer projects." />
      <div className="mb-4 grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={filters.projectId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value || undefined }))}>
          <option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
          {["", "AVAILABLE", "RESERVED", "SOLD", "HELD", "UNAVAILABLE"].map((v) => <option key={v || "all"} value={v}>{v || "All statuses"}</option>)}
        </select>
        <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={filters.unitType ?? ""} onChange={(e) => setFilters((f) => ({ ...f, unitType: e.target.value || undefined }))}>
          {["", "APARTMENT", "VILLA", "TOWNHOUSE", "OFFICE", "SHOP", "STUDIO", "LAND", "CHALET"].map((v) => <option key={v || "all"} value={v}>{v || "All unit types"}</option>)}
        </select>
        <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={filters.visibility ?? ""} onChange={(e) => setFilters((f) => ({ ...f, visibility: e.target.value || undefined }))}>
          {["", "INHERIT_PROJECT", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"].map((v) => <option key={v || "all"} value={v}>{v || "All visibility"}</option>)}
        </select>
      </div>
      <div className="space-y-6">
        <DetailCard title={editing ? `Edit ${editing.unitNumber}` : "Create Unit"}>
          <InventoryUnitForm
            unit={editing}
            projects={projects}
            isPending={editing ? update.isPending : create.isPending}
            error={editing ? update.error : create.error}
            onSubmit={(input) => editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input)}
          />
        </DetailCard>
        <DetailCard title="Units">
          {isLoading ? <LoadingState label="Loading inventory" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<InventoryUnit>
              columns={[
                { key: "unitNumber", header: "Unit" },
                { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
                { key: "unitType", header: "Type" },
                { key: "status", header: "Status", cell: (row) => <UnitStatusBadge status={row.status} /> },
                { key: "visibility", header: "Visibility", cell: (row) => <UnitVisibilityBadge visibility={row.visibility} /> },
                { key: "actions", header: "Actions", cell: (row) => <button className="text-sm font-medium underline" onClick={() => setEditing(row)}>Edit</button> },
              ]}
              data={data}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
