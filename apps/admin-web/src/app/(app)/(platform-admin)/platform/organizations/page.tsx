"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Filter, Plus } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationResponsiveList } from "@/components/platform/organization-responsive-list";
import { useOrganizations } from "@/hooks/use-platform-admin";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";

export default function PlatformOrganizationsPage() {
  const { t } = useI18n();
  const { data = [], isLoading, error } = useOrganizations();
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const rows = useMemo(
    () =>
      data.filter((organization) => {
        const typeMatches = type === "ALL" || organization.type === type;
        const statusMatches = status === "ALL" || organization.status === status;
        return typeMatches && statusMatches;
      }),
    [data, status, type],
  );

  return (
    <>
      <PageHeader
        title={t("platformOrganizations.title")}
        description={t("platformOrganizations.description")}
        actions={
          <Link className="ui-button ui-button-primary" href="/platform/organizations/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("provisioning.addCompany")}
          </Link>
        }
      />
      <section className="ui-card mb-5 p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Filter className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("platformOrganizations.filters.title")}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("platformOrganizations.filters.showing", { shown: rows.length, total: data.length })}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            {t("platformOrganizations.filters.countNote")}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <label className="space-y-2 text-sm font-medium text-[var(--color-foreground)]">
            <span>{t("common.type")}</span>
          <select
            className="ui-input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="ALL">{t("platformOrganizations.filters.allTypes")}</option>
            <option value="PLATFORM">{t("organizationType.platform")}</option>
            <option value="DEVELOPER">{t("organizationType.developer")}</option>
            <option value="BROKERAGE">{t("organizationType.brokerage")}</option>
            <option value="INDIVIDUAL_BROKER">{t("organizationType.individualBroker")}</option>
          </select>
        </label>
          <label className="space-y-2 text-sm font-medium text-[var(--color-foreground)]">
            <span>{t("common.status")}</span>
          <select
            className="ui-input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">{t("platformOrganizations.filters.allStatuses")}</option>
            <option value="DRAFT">{t("status.draft")}</option>
            <option value="PENDING_REVIEW">{t("status.pendingReview")}</option>
            <option value="APPROVED">{t("status.approved")}</option>
            <option value="SUSPENDED">{t("status.suspended")}</option>
            <option value="REVOKED">{t("status.revoked")}</option>
          </select>
        </label>
      </div>
      </section>
      {isLoading ? <LoadingState label={t("platformOrganizations.loading")} /> : null}
      {error ? (
        <FeedbackState tone="error" title={t("platformOrganizations.error")} description={organizationErrorDescription(error, t)} />
      ) : null}
      {!isLoading && !error ? (
        <OrganizationResponsiveList organizations={rows} totalCount={data.length} />
      ) : null}
    </>
  );
}

function organizationErrorDescription(error: Error, t: (key: string, params?: Record<string, string | number>) => string) {
  if (error instanceof ApiError) {
    return [
      error.message,
      t("platformOrganizations.error.status", { status: error.status }),
      error.requestId ? t("platformOrganizations.error.requestId", { requestId: error.requestId }) : "",
    ].filter(Boolean).join(" ");
  }
  return error.message;
}
