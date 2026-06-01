"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextAreaInput, TextInput } from "@/components/developer/form-fields";
import type { Project, ProjectInput } from "@/types/developer";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().optional(),
  type: z.enum(["COMPOUND", "BUILDING", "TOWER", "VILLA_COMPOUND", "COMMERCIAL", "MIXED_USE"]),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(["PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]),
  status: z.enum(["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"]),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectForm({
  project,
  submitLabel = "Save project",
  isPending,
  error,
  onSubmit,
}: {
  project?: Project;
  submitLabel?: string;
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: ProjectInput) => Promise<unknown>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      slug: project?.slug ?? "",
      type: project?.type ?? "COMPOUND",
      city: project?.city ?? "",
      district: project?.district ?? "",
      address: project?.address ?? "",
      description: project?.description ?? "",
      visibility: project?.visibility ?? "PRIVATE",
      status: project?.status ?? "DRAFT",
      latitude: project?.latitude ? String(project.latitude) : "",
      longitude: project?.longitude ? String(project.longitude) : "",
    },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          latitude: values.latitude ? Number(values.latitude) : undefined,
          longitude: values.longitude ? Number(values.longitude) : undefined,
        }),
      )}
    >
      <Field label="Name" error={errors.name?.message}><TextInput {...register("name")} /></Field>
      <Field label="Slug" error={errors.slug?.message}><TextInput {...register("slug")} /></Field>
      <Field label="Type" error={errors.type?.message}>
        <SelectInput {...register("type")}>
          {["COMPOUND", "BUILDING", "TOWER", "VILLA_COMPOUND", "COMMERCIAL", "MIXED_USE"].map((v) => <option key={v} value={v}>{v}</option>)}
        </SelectInput>
      </Field>
      <Field label="Status" error={errors.status?.message}>
        <SelectInput {...register("status")}>{["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput>
      </Field>
      <Field label="City"><TextInput {...register("city")} /></Field>
      <Field label="District"><TextInput {...register("district")} /></Field>
      <Field label="Address"><TextInput {...register("address")} /></Field>
      <Field label="Visibility">
        <SelectInput {...register("visibility")}>{["PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"].map((v) => <option key={v} value={v}>{v}</option>)}</SelectInput>
      </Field>
      <Field label="Latitude"><TextInput type="number" step="any" {...register("latitude")} /></Field>
      <Field label="Longitude"><TextInput type="number" step="any" {...register("longitude")} /></Field>
      <div className="md:col-span-2"><Field label="Description"><TextAreaInput {...register("description")} /></Field></div>
      {error ? <p className="md:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="md:col-span-2"><Button type="submit" disabled={isPending}>{isPending ? "Saving" : submitLabel}</Button></div>
    </form>
  );
}
