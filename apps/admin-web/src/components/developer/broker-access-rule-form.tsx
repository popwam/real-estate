"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, SelectInput, TextInput } from "@/components/developer/form-fields";
import { Button } from "@/components/ui/button";
import type { BrokerAccessRuleInput, Project } from "@/types/developer";
import { useI18n } from "@/i18n";

const schema = z.object({
  projectId: z.string().trim().min(1, "Project is required."),
  granteeType: z.enum(["BROKERAGE", "BROKER"]),
  granteeId: z.string().trim().min(1, "Grantee id is required."),
  accessLevel: z.enum(["VIEW", "VIEW_PRICE", "FULL"]),
  expiresAt: z.string().optional(),
});
type BrokerAccessRuleFormValues = z.infer<typeof schema>;

export function BrokerAccessRuleForm({ projects, isPending, error, onSubmit }: { projects: Project[]; isPending?: boolean; error?: Error | null; onSubmit: (input: BrokerAccessRuleInput) => Promise<unknown> }) {
  const { t } = useI18n();

  const { register, handleSubmit, formState: { errors } } = useForm<BrokerAccessRuleFormValues>({ resolver: zodResolver(schema), defaultValues: { projectId: "", granteeType: "BROKERAGE", granteeId: "", accessLevel: "VIEW", expiresAt: "" } });
  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit((v) => onSubmit({ ...v, expiresAt: v.expiresAt || undefined }))}>
      <Field label="Project" error={errors.projectId?.message}>
        <SelectInput {...register("projectId")}><option value="">{t("adminSweep.select.project.b4b37dd6")}</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectInput>
      </Field>
      <Field label="Grantee type"><SelectInput {...register("granteeType")}><option value="BROKERAGE">BROKERAGE</option><option value="BROKER">BROKER</option></SelectInput></Field>
      <Field label="Grantee id" error={errors.granteeId?.message}><TextInput {...register("granteeId")} /></Field>
      <Field label="Access level"><SelectInput {...register("accessLevel")}><option value="VIEW">VIEW</option><option value="VIEW_PRICE">VIEW_PRICE</option><option value="FULL">FULL</option></SelectInput></Field>
      <Field label="Expires at"><TextInput type="date" {...register("expiresAt")} /></Field>
      {error ? <p className="md:col-span-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
      <div className="md:col-span-3"><Button type="submit" disabled={isPending}>{isPending ? "Saving" : "Create access rule"}</Button></div>
    </form>
  );
}
