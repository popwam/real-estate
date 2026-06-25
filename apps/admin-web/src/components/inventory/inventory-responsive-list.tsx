import { BedDouble, Building2, Maximize2, Pencil, ShowerHead } from "lucide-react";
import { UnitStatusBadge, UnitVisibilityBadge } from "@/components/developer/badges";
import type { InventoryUnit } from "@/types/developer";

export function InventoryResponsiveList({
  units,
  onEdit,
  showProject = true,
}: {
  units: InventoryUnit[];
  onEdit?: (unit: InventoryUnit) => void;
  showProject?: boolean;
}) {
  return (
    <>
      <div className="grid gap-3 xl:hidden">
        {units.map((unit) => (
          <article key={unit.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">{formatLabel(unit.unitType)}</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">Unit {unit.unitNumber}</h3>
                {showProject ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                    {unit.project?.name ?? "Project context unavailable"}
                  </p>
                ) : null}
              </div>
              {onEdit ? <EditButton unit={unit} onEdit={onEdit} compact /> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <UnitStatusBadge status={unit.status} />
              <UnitVisibilityBadge visibility={unit.visibility} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Fact icon={<Maximize2 className="h-4 w-4" aria-hidden="true" />} label="Area" value={unit.areaSqm ? `${unit.areaSqm} m²` : "Not set"} />
              <Fact icon={<BedDouble className="h-4 w-4" aria-hidden="true" />} label="Bedrooms" value={unit.bedrooms?.toString() ?? "Not set"} />
              <Fact icon={<ShowerHead className="h-4 w-4" aria-hidden="true" />} label="Bathrooms" value={unit.bathrooms?.toString() ?? "Not set"} />
              <Fact label="Price" value={formatPrice(unit)} />
              <Fact label="Phase" value={unit.phase?.name ?? "Not assigned"} />
              <Fact label="Floor" value={unit.floor || "Not set"} />
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] xl:block">
        <table className="w-full border-collapse text-start text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <Header>Unit</Header>
              {showProject ? <Header>Project / phase</Header> : null}
              <Header>Specifications</Header>
              <Header>Price</Header>
              <Header>Status</Header>
              <Header>Visibility</Header>
              {onEdit ? <Header><span className="sr-only">Actions</span></Header> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {units.map((unit) => (
              <tr key={unit.id} className="hover:bg-[var(--color-surface-muted)]">
                <Cell>
                  <p className="font-semibold text-[var(--color-foreground)]">{unit.unitNumber}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{formatLabel(unit.unitType)}</p>
                </Cell>
                {showProject ? (
                  <Cell>
                    <p className="font-medium text-[var(--color-foreground)]">{unit.project?.name ?? "Project unavailable"}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{unit.phase?.name ?? "No phase"}</p>
                  </Cell>
                ) : null}
                <Cell>{specification(unit)}</Cell>
                <Cell><span className="font-semibold text-[var(--color-foreground)]">{formatPrice(unit)}</span></Cell>
                <Cell><UnitStatusBadge status={unit.status} /></Cell>
                <Cell><UnitVisibilityBadge visibility={unit.visibility} /></Cell>
                {onEdit ? <Cell><EditButton unit={unit} onEdit={onEdit} /></Cell> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 align-top text-[var(--color-muted)]">{children}</td>;
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">{icon}{label}</dt>
      <dd className="mt-1 font-semibold text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}

function EditButton({ unit, onEdit, compact = false }: { unit: InventoryUnit; onEdit: (unit: InventoryUnit) => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onEdit(unit)}
      className={compact ? "grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]" : "ui-button ui-button-secondary"}
      aria-label={`Edit unit ${unit.unitNumber}`}
    >
      <Pencil className="h-4 w-4" aria-hidden="true" />
      {compact ? null : "Edit"}
    </button>
  );
}

function specification(unit: InventoryUnit) {
  return [unit.areaSqm ? `${unit.areaSqm} m²` : null, unit.bedrooms != null ? `${unit.bedrooms} bed` : null, unit.bathrooms != null ? `${unit.bathrooms} bath` : null].filter(Boolean).join(" · ") || "Not set";
}

function formatPrice(unit: InventoryUnit) {
  if (unit.basePrice == null || unit.basePrice === "") return "Not set";
  const value = Number(unit.basePrice);
  if (!Number.isFinite(value)) return `${unit.basePrice} ${unit.currency ?? ""}`.trim();
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: unit.currency || "EGP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toLocaleString()} ${unit.currency ?? ""}`.trim();
  }
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
