"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, TextInput } from "@/components/developer/form-fields";
import { Button } from "@/components/ui/button";
import type { AgreementInput } from "@/types/developer";

const schema = z.object({
  brokerageId: z.string().trim().min(1, "Brokerage id is required."),
  expiresAt: z.string().optional(),
  termsUrl: z.string().optional(),
});
type AgreementFormValues = z.infer<typeof schema>;

export function AgreementForm({ isPending, error, onSubmit }: { isPending?: boolean; error?: Error | null; onSubmit: (input: AgreementInput) => Promise<unknown> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AgreementFormValues>({ resolver: zodResolver(schema), defaultValues: { brokerageId: "", expiresAt: "", termsUrl: "" } });
  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit((v) => onSubmit({ ...v, expiresAt: v.expiresAt || undefined, termsUrl: v.termsUrl || undefined }))}>
      <Field label="Brokerage organization id" error={errors.brokerageId?.message}><TextInput {...register("brokerageId")} /></Field>
      <Field label="Expires at"><TextInput type="date" {...register("expiresAt")} /></Field>
      <Field label="Terms URL"><TextInput {...register("termsUrl")} /></Field>
      {error ? <p className="md:col-span-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="md:col-span-3"><Button type="submit" disabled={isPending}>{isPending ? "Saving" : "Create proposal"}</Button></div>
    </form>
  );
}
