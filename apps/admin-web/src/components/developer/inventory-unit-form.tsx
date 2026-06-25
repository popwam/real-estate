"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextInput } from "@/components/developer/form-fields";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import type { InventoryUnit, InventoryUnitInput, Project } from "@/types/developer";

const schema = z.object({
  projectId: z.string().trim().min(1, "Project is required."),
  phaseId: z.string().optional(),
  unitNumber: z.string().trim().min(1, "Unit number is required."),
  unitType: z.enum(["APARTMENT", "VILLA", "TOWNHOUSE", "OFFICE", "SHOP", "STUDIO", "LAND", "CHALET"]),
  floor: z.string().optional(),
  areaSqm: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  finishing: z.enum(["", "CORE_SHELL", "SEMI_FINISHED", "FULLY_FINISHED", "FURNISHED"]),
  view: z.string().optional(),
  basePrice: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "HELD", "UNAVAILABLE"]),
  visibility: z.enum(["INHERIT_PROJECT", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]),
});

type Values = z.infer<typeof schema>;

function clean(values: Values, lockedProjectId?: string): InventoryUnitInput {
  return {
    ...values,
    projectId: lockedProjectId ?? values.projectId,
    phaseId: values.phaseId || undefined,
    finishing: values.finishing || undefined,
    areaSqm: values.areaSqm ? Number(values.areaSqm) : undefined,
    bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
    bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
    basePrice: values.basePrice ? Number(values.basePrice) : undefined,
  };
}

export function InventoryUnitForm({
  unit,
  projects,
  projectId,
  submitLabel = "Save unit",
  isPending,
  error,
  onCancel,
  onSubmit,
}: {
  unit?: InventoryUnit;
  projects: Project[];
  projectId?: string;
  submitLabel?: string;
  isPending?: boolean;
  error?: Error | null;
  onCancel?: () => void;
  onSubmit: (input: InventoryUnitInput) => Promise<unknown>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: unit?.projectId ?? projectId ?? "",
      phaseId: unit?.phaseId ?? "",
      unitNumber: unit?.unitNumber ?? "",
      unitType: unit?.unitType ?? "APARTMENT",
      floor: unit?.floor ?? "",
      areaSqm: unit?.areaSqm != null ? String(unit.areaSqm) : "",
      bedrooms: unit?.bedrooms != null ? String(unit.bedrooms) : "",
      bathrooms: unit?.bathrooms != null ? String(unit.bathrooms) : "",
      finishing: unit?.finishing ?? "",
      view: unit?.view ?? "",
      basePrice: unit?.basePrice != null ? String(unit.basePrice) : "",
      currency: unit?.currency ?? "EGP",
      status: unit?.status ?? "AVAILABLE",
      visibility: unit?.visibility ?? "INHERIT_PROJECT",
    },
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit((values) => onSubmit(clean(values, projectId)))}>
      <UnitFormSection title="Unit identity" description="Connect the unit to a project and record how the sales team identifies it.">
        <Field label="Project" error={errors.projectId?.message} required>
          <SelectInput {...register("projectId")} disabled={Boolean(projectId)}>
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </SelectInput>
        </Field>
        <Field label="Phase ID" hint="Optional existing project phase identifier."><TextInput {...register("phaseId")} /></Field>
        <Field label="Unit number" error={errors.unitNumber?.message} required><TextInput placeholder="Example: A-204" {...register("unitNumber")} /></Field>
        <Field label="Unit type" required><SelectInput {...register("unitType")}>{["APARTMENT", "VILLA", "TOWNHOUSE", "OFFICE", "SHOP", "STUDIO", "LAND", "CHALET"].map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</SelectInput></Field>
      </UnitFormSection>

      <UnitFormSection title="Specifications" description="Add the physical details buyers and sales teams use when comparing units.">
        <Field label="Floor"><TextInput {...register("floor")} /></Field>
        <Field label="Area (m²)"><TextInput type="number" step="any" min="0" inputMode="decimal" {...register("areaSqm")} /></Field>
        <Field label="Bedrooms"><TextInput type="number" min="0" inputMode="numeric" {...register("bedrooms")} /></Field>
        <Field label="Bathrooms"><TextInput type="number" min="0" inputMode="numeric" {...register("bathrooms")} /></Field>
        <Field label="Finishing"><SelectInput {...register("finishing")}><option value="">Not set</option>{["CORE_SHELL", "SEMI_FINISHED", "FULLY_FINISHED", "FURNISHED"].map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</SelectInput></Field>
        <Field label="View"><TextInput placeholder="Garden, sea, street…" {...register("view")} /></Field>
      </UnitFormSection>

      <UnitFormSection title="Commercial availability" description="Set the supported price, lifecycle status, and audience for this unit.">
        <Field label="Base price"><TextInput type="number" step="any" min="0" inputMode="decimal" {...register("basePrice")} /></Field>
        <Field label="Currency"><TextInput placeholder="EGP" {...register("currency")} /></Field>
        <Field label="Unit status" required><SelectInput {...register("status")}>{["AVAILABLE", "RESERVED", "SOLD", "HELD", "UNAVAILABLE"].map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</SelectInput></Field>
        <Field label="Unit visibility" required hint="Inherit project follows the project audience."><SelectInput {...register("visibility")}>{["INHERIT_PROJECT", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"].map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</SelectInput></Field>
      </UnitFormSection>

      {error ? <FeedbackState tone="error" title="Unit could not be saved" description={error.message} /> : null}
      <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:justify-end">
        {onCancel ? <button type="button" className="ui-button ui-button-secondary" onClick={onCancel}><X className="h-4 w-4" aria-hidden="true" />Cancel</button> : null}
        <Button type="submit" disabled={isPending}>{isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{isPending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}

function UnitFormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <fieldset className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 sm:p-5"><legend className="px-2 text-sm font-semibold text-[var(--color-foreground)]">{title}</legend><p className="mb-5 text-sm leading-6 text-[var(--color-muted)]">{description}</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div></fieldset>;
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
