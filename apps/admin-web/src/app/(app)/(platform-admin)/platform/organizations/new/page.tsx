"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CreateOrganizationForm } from "@/components/platform/create-organization-form";
import { useI18n } from "@/i18n";

export default function NewPlatformOrganizationPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        title={t("provisioning.addCompany")}
        description={t("provisioning.addCompanyDescription")}
        actions={
          <Link className="ui-button ui-button-secondary" href="/platform/organizations">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("common.back")}
          </Link>
        }
      />
      <CreateOrganizationForm />
    </>
  );
}
