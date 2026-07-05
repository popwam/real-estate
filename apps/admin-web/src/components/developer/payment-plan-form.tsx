"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextInput } from "@/components/developer/form-fields";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import type { PaymentPlanInput } from "@/types/developer";
import { useI18n } from "@/i18n";

const schema = z.object({
  unitId: z.string().optional(),
  scope: z.enum(["PROJECT", "UNIT"]),
  name: z.string().trim().min(1, "Name is required."),
  downPaymentPct: z.string().optional(),
  installmentMonths: z.string().optional(),
  installmentPct: z.string().optional(),
  onDeliveryPct: z.string().optional(),
  maintenanceFee: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function PaymentPlanForm({ isPending, error, onSubmit }: { isPending?: boolean; error?: Error | null; onSubmit: (input: PaymentPlanInput) => Promise<unknown> }) {
  const { t } = useI18n();

  const { register, handleSubmit, control, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { unitId: "", scope: "PROJECT", name: "", downPaymentPct: "", installmentMonths: "", installmentPct: "", onDeliveryPct: "", maintenanceFee: "" },
  });
  const scope = useWatch({ control, name: "scope" });

  return (
    <form className="space-y-5" onSubmit={handleSubmit((value) => onSubmit({
      ...value,
      unitId: value.unitId || undefined,
      downPaymentPct: value.downPaymentPct ? Number(value.downPaymentPct) : undefined,
      installmentMonths: value.installmentMonths ? Number(value.installmentMonths) : undefined,
      installmentPct: value.installmentPct ? Number(value.installmentPct) : undefined,
      onDeliveryPct: value.onDeliveryPct ? Number(value.onDeliveryPct) : undefined,
      maintenanceFee: value.maintenanceFee ? Number(value.maintenanceFee) : undefined,
    }))}>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Plan name" error={errors.name?.message} required><TextInput placeholder={t("adminSweep.example.10.over.8.years.f3202449")} {...register("name")} /></Field>
        <Field label="Plan scope" required hint={scope === "PROJECT" ? "Available at project level." : "Targets one existing unit ID."}><SelectInput {...register("scope")}><option value="PROJECT">{t("adminSweep.project.level.acf97d76")}</option><option value="UNIT">{t("adminSweep.unit.level.bd9de50e")}</option></SelectInput></Field>
        <Field label="Unit ID" hint={scope === "UNIT" ? "Enter the supported unit identifier." : "Leave empty for a project-level plan."}><TextInput {...register("unitId")} /></Field>
      </div>
      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:grid-cols-2 xl:grid-cols-5">
        <Field label="Down payment %"><TextInput type="number" step="any" min="0" inputMode="decimal" {...register("downPaymentPct")} /></Field>
        <Field label="Installment months"><TextInput type="number" min="0" inputMode="numeric" {...register("installmentMonths")} /></Field>
        <Field label="Installment %"><TextInput type="number" step="any" min="0" inputMode="decimal" {...register("installmentPct")} /></Field>
        <Field label="On delivery %"><TextInput type="number" step="any" min="0" inputMode="decimal" {...register("onDeliveryPct")} /></Field>
        <Field label="Maintenance fee"><TextInput type="number" step="any" min="0" inputMode="decimal" {...register("maintenanceFee")} /></Field>
      </div>
      {error ? <FeedbackState tone="error" title={t("adminSweep.payment.plan.could.not.be.created.51d1fd91")} description={error.message} /> : null}
      <div className="flex justify-end"><Button type="submit" disabled={isPending}>{isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}{isPending ? "Creating…" : "Create payment plan"}</Button></div>
    </form>
  );
}
