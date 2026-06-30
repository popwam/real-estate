"use client";

import { FormEvent, useState } from "react";
import { useCreatePlatformOrganization } from "@/hooks/use-platform-admin";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";

export function CreateOrganizationForm() {
  const { t } = useI18n();
  const create = useCreatePlatformOrganization();
  const [createdName, setCreatedName] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const organization = await create.mutateAsync({
      name: String(data.get("name") ?? ""),
      type: String(data.get("type") ?? "DEVELOPER") as "DEVELOPER" | "BROKERAGE" | "INDIVIDUAL_BROKER",
      city: optional(data.get("city")),
      country: optional(data.get("country")),
    });
    setCreatedName(organization.name);
    form.reset();
  }

  return (
    <section className="ui-card mb-5 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("organizationCreate.title")}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
          {t("organizationCreate.description")}
        </p>
      </div>
      <form className="grid gap-3 lg:grid-cols-[1.2fr_220px_1fr_1fr_auto]" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="platform-org-name">{t("organizationCreate.companyName")}</Label>
          <Input required id="platform-org-name" name="name" placeholder={t("organizationCreate.companyName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-org-type">{t("organizationCreate.companyType")}</Label>
          <select id="platform-org-type" name="type" className="ui-input">
            <option value="DEVELOPER">{t("organizationType.developer")}</option>
            <option value="BROKERAGE">{t("organizationType.brokerage")}</option>
            <option value="INDIVIDUAL_BROKER">{t("organizationType.individualBroker")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-org-city">{t("organizationCreate.city")}</Label>
          <Input id="platform-org-city" name="city" placeholder={t("organizationCreate.city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform-org-country">{t("organizationCreate.country")}</Label>
          <Input id="platform-org-country" name="country" placeholder={t("organizationCreate.country")} />
        </div>
        <div className="flex items-end">
          <Button className="w-full" disabled={create.isPending} type="submit">
            {create.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </div>
        {create.error ? (
          <FeedbackState
            className="lg:col-span-5"
            tone="error"
            title={t("organizationCreate.error")}
            description={create.error.message}
          />
        ) : null}
        {createdName ? (
          <FeedbackState
            className="lg:col-span-5"
            tone="success"
            title={t("organizationCreate.success", { name: createdName })}
            description={t("organizationCreate.successDescription")}
          />
        ) : null}
      </form>
    </section>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}
