"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Save } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WebsiteSettings, WebsiteSettingsInput } from "@/types/admin-public";
import { useI18n } from "@/i18n";

const schema = z.object({
  publicSlug: z.string().min(1, "Public slug is required."),
  subdomain: z.string().min(1, "Subdomain is required."),
  customDomain: z.string(),
  siteTitle: z.string().min(1, "Site title is required."),
  siteDescription: z.string(),
  logoUrl: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  contactPhone: z.string(),
  contactEmail: z.string(),
  whatsappUrl: z.string(),
  isPublished: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function WebsiteSettingsForm({
  settings,
  isPending,
  error,
  onSubmit,
}: {
  settings?: WebsiteSettings;
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: WebsiteSettingsInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(settings),
  });

  useEffect(() => {
    reset(toValues(settings));
  }, [settings, reset]);

  async function submit(values: Values) {
    await onSubmit({
      ...values,
      customDomain: nullable(values.customDomain),
      siteDescription: nullable(values.siteDescription),
      logoUrl: nullable(values.logoUrl),
      primaryColor: nullable(values.primaryColor),
      secondaryColor: nullable(values.secondaryColor),
      contactPhone: nullable(values.contactPhone),
      contactEmail: nullable(values.contactEmail),
      whatsappUrl: nullable(values.whatsappUrl),
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Public slug" error={errors.publicSlug?.message}>
          <Input {...register("publicSlug")} />
        </Field>
        <Field label="Subdomain" error={errors.subdomain?.message}>
          <Input {...register("subdomain")} />
        </Field>
        <Field label="Custom domain">
          <Input placeholder="example.com" {...register("customDomain")} />
        </Field>
        <Field label="Site title" error={errors.siteTitle?.message}>
          <Input {...register("siteTitle")} />
        </Field>
        <Field label="Logo URL">
          <Input {...register("logoUrl")} />
        </Field>
        <Field label="Primary color">
          <Input placeholder="#0f766e" {...register("primaryColor")} />
        </Field>
        <Field label="Secondary color">
          <Input placeholder="#111827" {...register("secondaryColor")} />
        </Field>
        <Field label="Contact phone">
          <Input {...register("contactPhone")} />
        </Field>
        <Field label="Contact email">
          <Input type="email" {...register("contactEmail")} />
        </Field>
        <Field label="WhatsApp URL">
          <Input {...register("whatsappUrl")} />
        </Field>
      </div>
      <Field label="Site description">
        <Textarea {...register("siteDescription")} />
      </Field>
      <label className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <input className="h-4 w-4 rounded border-zinc-300" type="checkbox" {...register("isPublished")} />{t("adminSweep.published.on.public.website.routes.a236ad5c")}</label>
      {error ? (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
      {isSubmitSuccessful && !error ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{t("adminSweep.website.settings.saved.cb618eb3")}</p>
      ) : null}
      <Button disabled={isPending} type="submit">
        <Save className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Saving" : "Save settings"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toValues(settings?: WebsiteSettings): Values {
  return {
    publicSlug: settings?.publicSlug ?? "",
    subdomain: settings?.subdomain ?? "",
    customDomain: settings?.customDomain ?? "",
    siteTitle: settings?.siteTitle ?? "",
    siteDescription: settings?.siteDescription ?? "",
    logoUrl: settings?.logoUrl ?? "",
    primaryColor: settings?.primaryColor ?? "",
    secondaryColor: settings?.secondaryColor ?? "",
    contactPhone: settings?.contactPhone ?? "",
    contactEmail: settings?.contactEmail ?? "",
    whatsappUrl: settings?.whatsappUrl ?? "",
    isPublished: settings?.isPublished ?? false,
  };
}
