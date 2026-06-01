"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectStatusBadge } from "@/components/developer/badges";
import { ProjectPhaseForm } from "@/components/developer/phase-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
import { useCreateProjectPhase, useProject, useProjectPhases, useUpdateProjectPhase } from "@/hooks/use-developer";
import { formatPlainDate } from "@/lib/format";
import type { ProjectPhase } from "@/types/developer";

export default function ProjectPhasesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data = [], isLoading, error } = useProjectPhases(id);
  const create = useCreateProjectPhase(id);
  const update = useUpdateProjectPhase(id);
  const [editing, setEditing] = useState<ProjectPhase | undefined>();

  return (
    <>
      <PageHeader title={`${project?.name ?? "Project"} Phases`} description="Create and update project delivery phases." />
      <div className="space-y-6">
        <DetailCard title={editing ? `Edit ${editing.name}` : "Create Phase"}>
          <ProjectPhaseForm
            phase={editing}
            isPending={editing ? update.isPending : create.isPending}
            error={editing ? update.error : create.error}
            onSubmit={(input) =>
              editing
                ? update.mutateAsync({ id: editing.id, input }).then(() => setEditing(undefined))
                : create.mutateAsync(input)
            }
          />
        </DetailCard>
        <DetailCard title="Phases">
          {isLoading ? <LoadingState label="Loading phases" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<ProjectPhase>
              columns={[
                { key: "name", header: "Name" },
                { key: "status", header: "Status", cell: (row) => <ProjectStatusBadge status={row.status} /> },
                { key: "deliveryDate", header: "Delivery", cell: (row) => formatPlainDate(row.deliveryDate) },
                { key: "totalUnits", header: "Total" },
                { key: "availableUnits", header: "Available" },
                { key: "actions", header: "Actions", cell: (row) => <button className="text-sm font-medium text-zinc-950 underline" onClick={() => setEditing(row)}>Edit</button> },
              ]}
              data={data}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
