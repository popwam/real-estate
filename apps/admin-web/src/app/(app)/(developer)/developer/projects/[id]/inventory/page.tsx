"use client";

import Link from "next/link";
import { ArrowLeft, PackagePlus, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { InventoryUnitForm } from "@/components/developer/inventory-unit-form";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { InventoryResponsiveList } from "@/components/inventory/inventory-responsive-list";
import { InventorySummaryCards } from "@/components/inventory/inventory-summary-cards";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateInventoryUnit, useInventoryUnits, useProject, useProjects, useUpdateInventoryUnit } from "@/hooks/use-developer";
import type { InventoryUnit } from "@/types/developer";

export default function ProjectInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProject(id);
  const { data: projects = [] } = useProjects();
  const units = useInventoryUnits({ projectId: id });
  const create = useCreateInventoryUnit();
  const update = useUpdateInventoryUnit();
  const [editing, setEditing] = useState<InventoryUnit>();
  const [formOpen, setFormOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [savedMessage, setSavedMessage] = useState<string>();

  function closeForm() {
    setEditing(undefined);
    setFormOpen(false);
  }

  function editUnit(unit: InventoryUnit) {
    setSavedMessage(undefined);
    setEditing(unit);
    setFormOpen(true);
    requestAnimationFrame(() => document.getElementById("unit-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (project.isLoading) return <LoadingState label="Loading project inventory" />;
  if (project.error) return <FeedbackState tone="error" title="Project could not be loaded" description={project.error.message} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.data?.name ?? "Project"} inventory`}
        description="Scan unit availability, pricing, and exposure without losing the project context."
        actions={<div className="flex flex-wrap gap-2"><Link href={`/developer/projects/${id}`} className="ui-button ui-button-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Project overview</Link><button type="button" className="ui-button ui-button-primary" onClick={() => { setSavedMessage(undefined); setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" aria-hidden="true" />Create unit</button></div>}
      />

      {units.isLoading ? <LoadingState label="Loading project units" /> : null}
      {units.error ? <FeedbackState tone="error" title="Project inventory could not be loaded" description={units.error.message} /> : null}
      {savedMessage ? <FeedbackState tone="success" title={savedMessage} /> : null}
      {!units.isLoading && !units.error ? <InventorySummaryCards units={units.data ?? []} /> : null}

      {formOpen ? (
        <div id="unit-form" className="scroll-mt-24">
          <DetailCard title={editing ? `Edit unit ${editing.unitNumber}` : "Create unit"}>
            <InventoryUnitForm
              key={`${editing?.id ?? "new"}-${formVersion}`}
              unit={editing}
              projects={projects}
              projectId={id}
              submitLabel={editing ? "Save unit changes" : "Create unit"}
              isPending={editing ? update.isPending : create.isPending}
              error={editing ? update.error : create.error}
              onCancel={closeForm}
              onSubmit={async (input) => {
                if (editing) {
                  await update.mutateAsync({ id: editing.id, input });
                  setSavedMessage(`Unit ${editing.unitNumber} updated`);
                } else {
                  await create.mutateAsync(input);
                  setSavedMessage("Unit created");
                }
                setFormVersion((version) => version + 1);
                closeForm();
              }}
            />
          </DetailCard>
        </div>
      ) : null}

      {!units.isLoading && !units.error ? (
        <section className="ui-card p-4 sm:p-5" aria-labelledby="project-units-title">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="project-units-title" className="text-lg font-semibold text-[var(--color-foreground)]">Units</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{(units.data ?? []).length.toLocaleString()} results in this project.</p></div>
          </div>
          {(units.data ?? []).length ? (
            <InventoryResponsiveList units={units.data ?? []} showProject={false} onEdit={editUnit} />
          ) : (
            <EmptyState icon={<PackagePlus className="h-5 w-5" aria-hidden="true" />} title="No units in this project" description="Create the first unit with its specifications, price, status, and visibility." action={<button type="button" className="ui-button ui-button-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />Create first unit</button>} />
          )}
        </section>
      ) : null}
    </div>
  );
}
