"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateOrganizationDomainInput } from "@/types/admin-public";
import { useI18n } from "@/i18n";

const schema = z.object({
  domain: z.string().min(1, "Domain is required."),
  type: z.enum(["CUSTOM_DOMAIN", "SUBDOMAIN"]),
});

type Values = z.infer<typeof schema>;

export function DomainCreateForm({
  isPending,
  error,
  onSubmit,
}: {
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: CreateOrganizationDomainInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { domain: "", type: "CUSTOM_DOMAIN" },
  });

  async function submit(values: Values) {
    await onSubmit(values);
    reset({ domain: "", type: "CUSTOM_DOMAIN" });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
        <div className="space-y-2">
          <Label>{t("adminSweep.domain.9b10914d")}</Label>
          <Input placeholder={t("adminSweep.example.com.or.my.brand.98595025")} {...register("domain")} />
          {errors.domain ? <p className="text-sm text-red-600">{errors.domain.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>{t("adminSweep.type.3deb7456")}</Label>
          <select
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            {...register("type")}
          >
            <option value="CUSTOM_DOMAIN">{t("adminSweep.custom.domain.0354c889")}</option>
            <option value="SUBDOMAIN">{t("adminSweep.popwam.subdomain.abee9d48")}</option>
          </select>
        </div>
        <Button disabled={isPending} type="submit">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Adding" : "Add"}
        </Button>
      </div>
      {error ? (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
    </form>
  );
}
