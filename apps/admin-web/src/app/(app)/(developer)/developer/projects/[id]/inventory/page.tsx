"use client";

import { useParams } from "next/navigation";
import { InventoryUnitForm } from "@/components/developer/inventory-unit-form";
import { UnitStatusBadge, UnitVisibilityBadge } from "@/components/developer/badges";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
import { useCreateInventoryUnit, useInventoryUnits, useProject, useProjects } from "@/hooks/use-developer";
import type { InventoryUnit } from "@/types/developer";

export default function ProjectInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data: projects = [] } = useProjects();
  const { data = [], isLoading, error } = useInventoryUnits({ projectId: id });
  const create = useCreateInventoryUnit();

  return (
    <>
      <PageHeader title={`${project?.name ?? "Project"} Inventory`} description="Create and manage units for this project." />
      <div className="space-y-6">
        <DetailCard title="Create Unit">
          <InventoryUnitForm projects={projects} projectId={id} isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="Units">
          {isLoading ? <LoadingState label="Loading units" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<InventoryUnit>
              columns={[
                { key: "unitNumber", header: "Unit" },
                { key: "unitType", header: "Type" },
                { key: "basePrice", header: "Price", cell: (row) => row.basePrice ? `${row.basePrice} ${row.currency ?? ""}` : "Not set" },
                { key: "status", header: "Status", cell: (row) => <UnitStatusBadge status={row.status} /> },
                { key: "visibility", header: "Visibility", cell: (row) => <UnitVisibilityBadge visibility={row.visibility} /> },
              ]}
              data={data}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
