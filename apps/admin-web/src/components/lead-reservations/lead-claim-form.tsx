"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateLeadClaimInput } from "@/types/lead-reservations";

const schema = z.object({
  clientName: z.string().min(1, "Client name is required."),
  phone: z.string().min(6, "Phone is required."),
  projectId: z.string().min(1, "Project id is required."),
  unitId: z.string(),
  source: z.string(),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

export function LeadClaimForm({
  isPending,
  error,
  onSubmit,
}: {
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: CreateLeadClaimInput) => Promise<unknown>;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { clientName: "", phone: "", projectId: "", unitId: "", source: "MANUAL", notes: "" },
  });

  async function submit(values: Values) {
    await onSubmit({
      clientName: values.clientName,
      phone: values.phone,
      projectId: values.projectId,
      unitId: values.unitId || undefined,
      source: values.source || undefined,
      notes: values.notes || undefined,
    });
    reset();
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <Field label="Client name" error={errors.clientName?.message}>
        <Input {...register("clientName")} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <Input {...register("phone")} />
      </Field>
      <Field label="Project ID" error={errors.projectId?.message}>
        <Input {...register("projectId")} />
      </Field>
      <Field label="Unit ID (optional)">
        <Input {...register("unitId")} />
      </Field>
      <Field label="Source">
        <Input {...register("source")} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Notes">
          <Textarea {...register("notes")} />
        </Field>
      </div>
      {error ? (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
      <div className="md:col-span-2">
        <Button disabled={isPending} type="submit">{isPending ? "Creating" : "Create lead claim"}</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
