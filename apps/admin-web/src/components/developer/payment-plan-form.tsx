"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextInput } from "@/components/developer/form-fields";
import { Button } from "@/components/ui/button";
import type { PaymentPlanInput } from "@/types/developer";

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
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { unitId: "", scope: "PROJECT", name: "", downPaymentPct: "", installmentMonths: "", installmentPct: "", onDeliveryPct: "", maintenanceFee: "" },
  });
  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit((v) => onSubmit({
      ...v,
      unitId: v.unitId || undefined,
      downPaymentPct: v.downPaymentPct ? Number(v.downPaymentPct) : undefined,
      installmentMonths: v.installmentMonths ? Number(v.installmentMonths) : undefined,
      installmentPct: v.installmentPct ? Number(v.installmentPct) : undefined,
      onDeliveryPct: v.onDeliveryPct ? Number(v.onDeliveryPct) : undefined,
      maintenanceFee: v.maintenanceFee ? Number(v.maintenanceFee) : undefined,
    }))}>
      <Field label="Name" error={errors.name?.message}><TextInput {...register("name")} /></Field>
      <Field label="Scope"><SelectInput {...register("scope")}><option value="PROJECT">PROJECT</option><option value="UNIT">UNIT</option></SelectInput></Field>
      <Field label="Unit id"><TextInput {...register("unitId")} /></Field>
      <Field label="Down payment %"><TextInput type="number" step="any" {...register("downPaymentPct")} /></Field>
      <Field label="Installment months"><TextInput type="number" {...register("installmentMonths")} /></Field>
      <Field label="Installment %"><TextInput type="number" step="any" {...register("installmentPct")} /></Field>
      <Field label="On delivery %"><TextInput type="number" step="any" {...register("onDeliveryPct")} /></Field>
      <Field label="Maintenance fee"><TextInput type="number" step="any" {...register("maintenanceFee")} /></Field>
      {error ? <p className="md:col-span-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="md:col-span-3"><Button type="submit" disabled={isPending}>{isPending ? "Saving" : "Create payment plan"}</Button></div>
    </form>
  );
}
