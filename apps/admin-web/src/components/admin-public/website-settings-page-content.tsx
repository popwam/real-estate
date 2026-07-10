"use client";

import { WebsiteSettingsForm } from "@/components/admin-public/website-settings-form";
import { CompanyHrSettings } from "@/components/hr/company-hr-settings";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useUpdateWebsiteSettings, useWebsiteSettings } from "@/hooks/use-admin-public";
import type { WebsiteSettingsInput } from "@/types/admin-public";
import { useI18n } from "@/i18n";

export function WebsiteSettingsPageContent() {
  const { t } = useI18n();

  const { data, isLoading, error } = useWebsiteSettings();
  const update = useUpdateWebsiteSettings();

  return (
    <>
      <PageHeader title={t("adminSweep.website.settings.016ff8af")} description={t("companySettings.pageDescription")} />
      <div className="space-y-5">
        <DetailCard title={t("adminSweep.public.website.e403cd62")}>
          {isLoading ? <LoadingState label={t("companySettings.loadingWebsiteSettings")} /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <WebsiteSettingsForm
              error={update.error}
              isPending={update.isPending}
              settings={data}
              onSubmit={(input: WebsiteSettingsInput) => update.mutateAsync(input)}
            />
          ) : null}
        </DetailCard>
        <CompanyHrSettings />
      </div>
    </>
  );
}
