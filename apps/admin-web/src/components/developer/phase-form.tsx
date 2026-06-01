"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextInput } from "@/components/developer/form-fields";
import { Button } from "@/components/ui/button";
import type { ProjectPhase, ProjectPhaseInput } from "@/types/developer";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  deliveryDate: z.string().optional(),
  totalUnits: z.string().optional(),
  availableUnits: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"]),
});
type Values = z.infer<typeof schema>;

export function ProjectPhaseForm({ phase, isPending, error, onSubmit }: { phase?: ProjectPhase; isPending?: boolean; error?: Error | null; onSubmit: (input: ProjectPhaseInput) => Promise<unknown> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: phase?.name ?? "", deliveryDate: phase?.deliveryDate?.slice(0, 10) ?? "", totalUnits: phase?.totalUnits ? String(phase.totalUnits) : "", availableUnits: phase?.availableUnits ? String(phase.availableUnits) : "", status: phase?.status ?? "DRAFT" } });
  return (
    <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit((v) => onSubmit({ ...v, deliveryDate: v.deliveryDate || undefined, totalUnits: v.totalUnits ? Number(v.totalUnits) : undefined, availableUnits: v.availableUnits ? Number(v.availableUnits) : undefined }))}>
      <Field label="Name" error={errors.name?.message}><TextInput {...register("name")} /></Field>
      <Field label="Delivery date"><TextInput type="date" {...register("deliveryDate")} /></Field>
      <Field label="Total units"><TextInput type="number" {...register("totalUnits")} /></Field>
      <Field label="Available units"><TextInput type="number" {...register("availableUnits")} /></Field>
      <Field label="Status"><SelectInput {...register("status")}>{["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput></Field>
      {error ? <p className="md:col-span-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="md:col-span-5"><Button type="submit" disabled={isPending}>{isPending ? "Saving" : phase ? "Update phase" : "Create phase"}</Button></div>
    </form>
  );
}
