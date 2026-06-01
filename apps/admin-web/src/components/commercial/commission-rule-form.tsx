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
      <Field label="Party type"><select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" {...register("partyType")}><option value="BROKERAGE">BROKERAGE</option><option value="BROKER">BROKER</option><option value="PLATFORM">PLATFORM</option><option value="DEVELOPER">DEVELOPER</option></select></Field>
      <Field label="Target organization ID"><Input {...register("targetOrganizationId")} /></Field>
      <Field label="Target user ID"><Input {...register("targetUserId")} /></Field>
      <Field label="Commission type"><select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" {...register("commissionType")}><option value="PERCENTAGE">PERCENTAGE</option><option value="FIXED">FIXED</option></select></Field>
      <Field label="Value" error={errors.value?.message}><Input type="number" min="0" step="0.0001" {...register("value")} /></Field>
      <Field label="Currency"><Input {...register("currency")} /></Field>
      <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" {...register("isActive")} /> Active</label>
      <div className="md:col-span-2"><Field label="Notes"><Textarea {...register("notes")} /></Field></div>
      {error ? <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error.message}</span></div> : null}
      <div className="md:col-span-2"><Button disabled={isPending} type="submit">{isPending ? "Saving" : rule ? "Update rule" : "Create rule"}</Button></div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-sm text-red-600">{error}</p> : null}</div>;
}
