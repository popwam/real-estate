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
import { useI18n } from "@/i18n";
import type { InventoryUnit } from "@/types/developer";

const initialFilters: Record<string, string | undefined> = {};

export default function DeveloperInventoryPage() {
  const { t } = useI18n();
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
      <PageHeader title={t("developerInventory.title")} description={t("developerInventory.description")} actions={<button type="button" className="ui-button ui-button-primary" onClick={() => { setSavedMessage(undefined); setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" aria-hidden="true" />{t("developerInventory.createUnit")}</button>} />

      <section className="ui-card p-4 sm:p-5" aria-labelledby="inventory-filters-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="inventory-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">{t("developerInventory.filterInventory")}</h2><p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{t("developerInventory.filterDescription")}</p></div>
          {hasFilters ? <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}><RotateCcw className="h-4 w-4" aria-hidden="true" />{t("common.clearFilters")}</button> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Filter label={t("common.project")} value={filters.projectId ?? ""} onChange={(value) => setFilters((current) => ({ ...current, projectId: value || undefined }))}><option value="">{t("developerInventory.allProjects")}</option>{(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Filter>
          <Filter label={t("common.status")} value={filters.status ?? ""} onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))}><Options allLabel={t("common.all")} values={["AVAILABLE", "RESERVED", "SOLD", "HELD", "UNAVAILABLE"]} optionLabel={(value) => t(`unitStatus.${value}`)} /></Filter>
          <Filter label={t("developerInventory.unitType")} value={filters.unitType ?? ""} onChange={(value) => setFilters((current) => ({ ...current, unitType: value || undefined }))}><Options allLabel={t("common.all")} values={["APARTMENT", "VILLA", "TOWNHOUSE", "OFFICE", "SHOP", "STUDIO", "LAND", "CHALET"]} optionLabel={(value) => t(`unitType.${value}`)} /></Filter>
          <Filter label={t("common.visibility")} value={filters.visibility ?? ""} onChange={(value) => setFilters((current) => ({ ...current, visibility: value || undefined }))}><Options allLabel={t("common.all")} values={["INHERIT_PROJECT", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]} optionLabel={(value) => t(`unitVisibility.${value}`)} /></Filter>
        </div>
      </section>

      {inventory.isLoading ? <LoadingState label={t("developerInventory.loading")} /> : null}
      {inventory.error ? <FeedbackState tone="error" title={t("developerInventory.loadError")} description={inventory.error.message} /> : null}
      {savedMessage ? <FeedbackState tone="success" title={savedMessage} /> : null}
      {!inventory.isLoading && !inventory.error ? <InventorySummaryCards units={inventory.data ?? []} /> : null}

      {formOpen ? (
        <div id="global-unit-form" className="scroll-mt-24">
          <DetailCard title={editing ? t("developerInventory.editUnitTitle", { unit: editing.unitNumber }) : t("developerInventory.createUnit")}>
            <InventoryUnitForm
              key={`${editing?.id ?? "new"}-${formVersion}`}
              unit={editing}
              projects={projects.data ?? []}
              submitLabel={editing ? t("developerInventory.saveUnitChanges") : t("developerInventory.createUnit")}
              isPending={editing ? update.isPending : create.isPending}
              error={editing ? update.error : create.error}
              onCancel={closeForm}
              onSubmit={async (input) => {
                if (editing) {
                  await update.mutateAsync({ id: editing.id, input });
                  setSavedMessage(t("developerInventory.unitUpdated", { unit: editing.unitNumber }));
                } else {
                  await create.mutateAsync(input);
                  setSavedMessage(t("developerInventory.unitCreated"));
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
          <div className="mb-5"><h2 id="inventory-results-title" className="text-lg font-semibold text-[var(--color-foreground)]">{t("developerInventory.results")}</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{t("developerInventory.resultCount", { count: (inventory.data ?? []).length.toLocaleString(), units: (inventory.data ?? []).length === 1 ? t("developerInventory.unitSingular") : t("developerInventory.unitPlural") })}</p></div>
          {(inventory.data ?? []).length ? <InventoryResponsiveList units={inventory.data ?? []} onEdit={editUnit} /> : <EmptyState icon={<PackagePlus className="h-5 w-5" aria-hidden="true" />} title={hasFilters ? t("developerInventory.noMatches") : t("developerInventory.noneYet")} description={hasFilters ? t("developerInventory.noMatchesDescription") : t("developerInventory.noneYetDescription")} action={hasFilters ? <button type="button" className="ui-button ui-button-secondary" onClick={() => setFilters(initialFilters)}>{t("common.clearFilters")}</button> : <button type="button" className="ui-button ui-button-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />{t("developerInventory.createFirstUnit")}</button>} />}
        </section>
      ) : null}
    </div>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{label}<select className="ui-input" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function Options({ allLabel, values, optionLabel }: { allLabel: string; values: string[]; optionLabel: (value: string) => string }) {
  return <><option value="">{allLabel}</option>{values.map((value) => <option key={value} value={value}>{optionLabel(value)}</option>)}</>;
}
