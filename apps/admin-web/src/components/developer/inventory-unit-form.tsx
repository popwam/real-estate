"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextInput } from "@/components/developer/form-fields";
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

function clean(values: Values): InventoryUnitInput {
  return {
    ...values,
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
  onSubmit,
}: {
  unit?: InventoryUnit;
  projects: Project[];
  projectId?: string;
  submitLabel?: string;
  isPending?: boolean;
  error?: Error | null;
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
      areaSqm: unit?.areaSqm ? String(unit.areaSqm) : "",
      bedrooms: unit?.bedrooms ? String(unit.bedrooms) : "",
      bathrooms: unit?.bathrooms ? String(unit.bathrooms) : "",
      finishing: unit?.finishing ?? "",
      view: unit?.view ?? "",
      basePrice: unit?.basePrice ? String(unit.basePrice) : "",
      currency: unit?.currency ?? "EGP",
      status: unit?.status ?? "AVAILABLE",
      visibility: unit?.visibility ?? "INHERIT_PROJECT",
    },
  });

  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit((v) => onSubmit(clean(v)))}>
      <Field label="Project" error={errors.projectId?.message}>
        <SelectInput {...register("projectId")} disabled={Boolean(projectId)}>
          <option value="">Select project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Phase id"><TextInput {...register("phaseId")} /></Field>
      <Field label="Unit number" error={errors.unitNumber?.message}><TextInput {...register("unitNumber")} /></Field>
      <Field label="Unit type"><SelectInput {...register("unitType")}>{["APARTMENT", "VILLA", "TOWNHOUSE", "OFFICE", "SHOP", "STUDIO", "LAND", "CHALET"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput></Field>
      <Field label="Floor"><TextInput {...register("floor")} /></Field>
      <Field label="Area sqm"><TextInput type="number" step="any" {...register("areaSqm")} /></Field>
      <Field label="Bedrooms"><TextInput type="number" {...register("bedrooms")} /></Field>
      <Field label="Bathrooms"><TextInput type="number" {...register("bathrooms")} /></Field>
      <Field label="Finishing"><SelectInput {...register("finishing")}><option value="">Not set</option>{["CORE_SHELL", "SEMI_FINISHED", "FULLY_FINISHED", "FURNISHED"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput></Field>
      <Field label="View"><TextInput {...register("view")} /></Field>
      <Field label="Base price"><TextInput type="number" step="any" {...register("basePrice")} /></Field>
      <Field label="Currency"><TextInput {...register("currency")} /></Field>
      <Field label="Status"><SelectInput {...register("status")}>{["AVAILABLE", "RESERVED", "SOLD", "HELD", "UNAVAILABLE"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput></Field>
      <Field label="Visibility"><SelectInput {...register("visibility")}>{["INHERIT_PROJECT", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput></Field>
      {error ? <p className="md:col-span-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="md:col-span-3"><Button type="submit" disabled={isPending}>{isPending ? "Saving" : submitLabel}</Button></div>
    </form>
  );
}
