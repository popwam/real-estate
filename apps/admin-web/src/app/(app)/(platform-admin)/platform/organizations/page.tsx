"use client";

import { useMemo, useState } from "react";
import { Building2, Filter } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationResponsiveList } from "@/components/platform/organization-responsive-list";
import { useOrganizations } from "@/hooks/use-platform-admin";
import { CreateOrganizationForm } from "@/components/platform/create-organization-form";

export default function PlatformOrganizationsPage() {
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
        title="Organizations"
        description="Trust and access control center for developers, brokerages, individual brokers, and platform-owned entities."
      />
      <CreateOrganizationForm />
      <section className="ui-card mb-5 p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Filter className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Review filters</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Showing {rows.length} of {data.length} organization records.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            Result count is based on the loaded organization list.
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <label className="space-y-2 text-sm font-medium text-[var(--color-foreground)]">
            <span>Type</span>
          <select
            className="ui-input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="ALL">All types</option>
            <option value="PLATFORM">Platform</option>
            <option value="DEVELOPER">Developer</option>
            <option value="BROKERAGE">Brokerage</option>
            <option value="INDIVIDUAL_BROKER">Individual broker</option>
          </select>
        </label>
          <label className="space-y-2 text-sm font-medium text-[var(--color-foreground)]">
            <span>Status</span>
          <select
            className="ui-input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </label>
      </div>
      </section>
      {isLoading ? <LoadingState label="Loading organizations" /> : null}
      {error ? (
        <FeedbackState tone="error" title="Could not load organizations" description={error.message} />
      ) : null}
      {!isLoading && !error ? (
        <OrganizationResponsiveList organizations={rows} totalCount={data.length} />
      ) : null}
    </>
  );
}
