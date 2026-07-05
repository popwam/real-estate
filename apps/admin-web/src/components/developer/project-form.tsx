"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextAreaInput, TextInput } from "@/components/developer/form-fields";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import type { Project, ProjectInput } from "@/types/developer";
import { useI18n } from "@/i18n";

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
  successMessage,
  onSubmit,
}: {
  project?: Project;
  submitLabel?: string;
  isPending?: boolean;
  error?: Error | null;
  successMessage?: string;
  onSubmit: (input: ProjectInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
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
      latitude: project?.latitude != null ? String(project.latitude) : "",
      longitude: project?.longitude != null ? String(project.longitude) : "",
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          latitude: values.latitude ? Number(values.latitude) : undefined,
          longitude: values.longitude ? Number(values.longitude) : undefined,
        }),
      )}
    >
      <FormSection
        title={t("adminSweep.basic.information.d8bc7383")}
        description="Name the project and define how it is classified inside the portfolio."
      >
        <Field label="Project name" error={errors.name?.message} required>
          <TextInput placeholder={t("adminSweep.example.north.coast.residence.7c564608")} {...register("name")} />
        </Field>
        <Field label="Public slug" error={errors.slug?.message} hint="Used in public URLs when the project is published.">
          <TextInput placeholder="north-coast-residence" {...register("slug")} />
        </Field>
        <Field label="Project type" error={errors.type?.message} required>
          <SelectInput {...register("type")}>
            {["COMPOUND", "BUILDING", "TOWER", "VILLA_COMPOUND", "COMMERCIAL", "MIXED_USE"].map((value) => (
              <option key={value} value={value}>{formatLabel(value)}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Lifecycle status" error={errors.status?.message} required hint="Draft projects remain editable and are not automatically public.">
          <SelectInput {...register("status")}>
            {["DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"].map((value) => (
              <option key={value} value={value}>{formatLabel(value)}</option>
            ))}
          </SelectInput>
        </Field>
      </FormSection>

      <FormSection
        title={t("adminSweep.location.d219c681")}
        description="Add the customer-facing location first; coordinates are optional operational metadata."
      >
        <Field label="City"><TextInput placeholder={t("adminSweep.city.4271627f")} {...register("city")} /></Field>
        <Field label="District"><TextInput placeholder={t("adminSweep.district.or.area.b266f3e0")} {...register("district")} /></Field>
        <div className="md:col-span-2">
          <Field label="Address"><TextInput placeholder={t("adminSweep.street.or.development.address.edd2b614")} {...register("address")} /></Field>
        </div>
        <Field label="Latitude" hint="Optional decimal coordinate.">
          <TextInput type="number" step="any" inputMode="decimal" {...register("latitude")} />
        </Field>
        <Field label="Longitude" hint="Optional decimal coordinate.">
          <TextInput type="number" step="any" inputMode="decimal" {...register("longitude")} />
        </Field>
      </FormSection>

      <FormSection
        title={t("adminSweep.description.and.publishing.f5c470ac")}
        description="Set the private/public description and choose the current audience. Unit pricing is managed from Inventory."
      >
        <div className="md:col-span-2">
          <Field label="Project description" hint="Explain the project clearly without private notes.">
            <TextAreaInput className="min-h-32" placeholder={t("adminSweep.project.overview.positioning.and.key.information.477868f1")} {...register("description")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Visibility" required hint="You can review audience impact in detail from the Visibility page.">
            <SelectInput {...register("visibility")}>
              {["PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"].map((value) => (
                <option key={value} value={value}>{formatLabel(value)}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="md:col-span-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted)]">{t("adminSweep.creating.or.editing.this.record.does.not.add.inv.8d3d26c5")}</div>
      </FormSection>

      {error ? (
        <FeedbackState tone="error" title={t("adminSweep.project.could.not.be.saved.f3096a4e")} description={error.message} />
      ) : null}
      {successMessage ? <FeedbackState tone="success" title={successMessage} /> : null}

      <div className="flex justify-end border-t border-[var(--color-border)] pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <legend className="px-2 text-sm font-semibold text-[var(--color-foreground)]">{title}</legend>
      <p className="mb-5 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
