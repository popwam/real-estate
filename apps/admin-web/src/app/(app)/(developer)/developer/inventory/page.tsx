"use client";

import { PackagePlus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { InventoryUnitForm } from "@/components/developer/inventory-unit-form";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { InventoryResponsiveList } from "@/components/inventory/inventory-responsive-list";
import { InventorySummaryCards } from "@/components/inventory/inventory-summary-cards";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateInventoryUnit, useInventoryUnits, useProjects, useUpdateInventoryUnit } from "@/hooks/use-developer";
import type { InventoryUnit } from "@/types/developer";

const initialFilters: Record<string, string | undefined> = {};

export default function DeveloperInventoryPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>(initialFilters);
  const [editing, setEditing] = useState<InventoryUnit>();
  const [formOpen, setFormOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [savedMessage, setSavedMessage] = useState<string>();
  const projects = useProjects();
  const inventory = useInventoryUnits(filters);
  const create = useCreateInventoryUnit();
  const update = useUpdateInventoryUnit();
  const hasFilters = Object.values(filters).some(Boolean);

  function closeForm() {
    setEditing(undefined);
    setFormOpen(false);
  }

  function editUnit(unit: InventoryUnit) {
    setSavedMessage(undefined);
    setEditing(unit);
    setFormOpen(true);
    requestAnimationFrame(() => document.getElementById("global-unit-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory control" description="Manage unit availability, pricing, and visibility across the developer portfolio." actions={<button type="button" className="ui-button ui-button-primary" onClick={() => { setSavedMessage(undefined); setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" aria-hidden="true" />Create unit</button>} />

      <section className="ui-card p-4 sm:p-5" aria-labelledby="inventory-filters-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="inventory-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">Filter inventory</h2><p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">Narrow the organization-scoped inventory without hiding project context.</p></div>
          {hasFilters ? <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}><RotateCcw className="h-4 w-4" aria-hidden="true" />Clear filters</button> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Filter label="Project" value={filters.projectId ?? ""} onChange={(value) => setFilters((current) => ({ ...current, projectId: value || undefined }))}><option value="">All projects</option>{(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Filter>
          <Filter label="Status" value={filters.status ?? ""} onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))}><Options values={["AVAILABLE", "RESERVED", "SOLD", "HELD", "UNAVAILABLE"]} /></Filter>
          <Filter label="Unit type" value={filters.unitType ?? ""} onChange={(value) => setFilters((current) => ({ ...current, unitType: value || undefined }))}><Options values={["APARTMENT", "VILLA", "TOWNHOUSE", "OFFICE", "SHOP", "STUDIO", "LAND", "CHALET"]} /></Filter>
          <Filter label="Visibility" value={filters.visibility ?? ""} onChange={(value) => setFilters((current) => ({ ...current, visibility: value || undefined }))}><Options values={["INHERIT_PROJECT", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]} /></Filter>
        </div>
      </section>

      {inventory.isLoading ? <LoadingState label="Loading inventory" /> : null}
      {inventory.error ? <FeedbackState tone="error" title="Inventory could not be loaded" description={inventory.error.message} /> : null}
      {savedMessage ? <FeedbackState tone="success" title={savedMessage} /> : null}
      {!inventory.isLoading && !inventory.error ? <InventorySummaryCards units={inventory.data ?? []} /> : null}

      {formOpen ? (
        <div id="global-unit-form" className="scroll-mt-24">
          <DetailCard title={editing ? `Edit unit ${editing.unitNumber}` : "Create unit"}>
            <InventoryUnitForm
              key={`${editing?.id ?? "new"}-${formVersion}`}
              unit={editing}
              projects={projects.data ?? []}
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

      {!inventory.isLoading && !inventory.error ? (
        <section className="ui-card p-4 sm:p-5" aria-labelledby="inventory-results-title">
          <div className="mb-5"><h2 id="inventory-results-title" className="text-lg font-semibold text-[var(--color-foreground)]">Inventory results</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{(inventory.data ?? []).length.toLocaleString()} {(inventory.data ?? []).length === 1 ? "unit" : "units"} in the current result set.</p></div>
          {(inventory.data ?? []).length ? <InventoryResponsiveList units={inventory.data ?? []} onEdit={editUnit} /> : <EmptyState icon={<PackagePlus className="h-5 w-5" aria-hidden="true" />} title={hasFilters ? "No units match these filters" : "No inventory units yet"} description={hasFilters ? "Clear or adjust filters to return to the full inventory." : "Create the first unit and connect it to an existing project."} action={hasFilters ? <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}>Clear filters</button> : <button type="button" className="ui-button ui-button-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />Create first unit</button>} />}
        </section>
      ) : null}
    </div>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{label}<select className="ui-input" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function Options({ values }: { values: string[] }) {
  return <><option value="">All</option>{values.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</>;
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
