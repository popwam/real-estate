"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CommissionRule, CommissionRuleInput } from "@/types/commercial";
import { useI18n } from "@/i18n";

const schema = z.object({
  projectId: z.string().min(1, "Project ID is required."),
  partyType: z.enum(["DEVELOPER", "BROKERAGE", "BROKER", "PLATFORM"]),
  targetOrganizationId: z.string(),
  targetUserId: z.string(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.string().min(1, "Value is required."),
  currency: z.string(),
  isActive: z.boolean(),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

export function CommissionRuleForm({
  rule,
  isPending,
  error,
  onSubmit,
}: {
  rule?: CommissionRule;
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: CommissionRuleInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      projectId: rule?.projectId ?? "",
      partyType: rule?.partyType ?? "BROKERAGE",
      targetOrganizationId: rule?.targetOrganizationId ?? "",
      targetUserId: rule?.targetUserId ?? "",
      commissionType: rule?.commissionType ?? "PERCENTAGE",
      value: String(rule?.value ?? ""),
      currency: rule?.currency ?? "EGP",
      isActive: rule?.isActive ?? true,
      notes: rule?.notes ?? "",
    },
  });

  async function submit(values: Values) {
    await onSubmit({
      projectId: values.projectId,
      partyType: values.partyType,
      targetOrganizationId: values.targetOrganizationId || undefined,
      targetUserId: values.targetUserId || undefined,
      commissionType: values.commissionType,
      value: Number(values.value),
      currency: values.currency || undefined,
      isActive: values.isActive,
      notes: values.notes || undefined,
    });
    if (!rule) reset();
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <Field label="Project ID" error={errors.projectId?.message}><Input {...register("projectId")} /></Field>
      <Field label="Beneficiary type"><select className="ui-input" {...register("partyType")}><option value="BROKERAGE">{t("adminSweep.brokerage.1452e468")}</option><option value="BROKER">{t("adminSweep.broker.a882cca9")}</option><option value="PLATFORM">{t("adminSweep.platform.123a7f2f")}</option><option value="DEVELOPER">{t("adminSweep.developer.7e08ebec")}</option></select></Field>
      <Field label="Target organization ID"><Input {...register("targetOrganizationId")} /></Field>
      <Field label="Target user ID"><Input {...register("targetUserId")} /></Field>
      <Field label="Calculation method"><select className="ui-input" {...register("commissionType")}><option value="PERCENTAGE">{t("adminSweep.percentage.of.deal.value.a1250259")}</option><option value="FIXED">{t("adminSweep.fixed.amount.341e8bb9")}</option></select></Field>
      <Field label="Value" error={errors.value?.message}><Input type="number" min="0" step="0.0001" {...register("value")} /></Field>
      <Field label="Currency"><Input {...register("currency")} /></Field>
      <label className="flex items-center gap-2 text-sm text-[var(--color-text)]"><input type="checkbox" {...register("isActive")} />{t("adminSweep.active.for.eligible.deals.b1f1b47c")}</label>
      <div className="md:col-span-2"><Field label="Notes"><Textarea {...register("notes")} /></Field></div>
      {error ? <div className="ui-feedback ui-feedback-error flex gap-2 text-sm md:col-span-2" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error.message}</span></div> : null}
      <div className="md:col-span-2"><Button disabled={isPending} type="submit">{isPending ? "Saving" : rule ? "Update rule" : "Create rule"}</Button></div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-sm text-[var(--color-danger)]" role="alert">{error}</p> : null}</div>;
}
