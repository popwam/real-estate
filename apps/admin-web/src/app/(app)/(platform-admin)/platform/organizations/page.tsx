"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationStatusBadge } from "@/components/platform/organization-status-badge";
import { DataTable } from "@/components/tables/data-table";
import { useOrganizations } from "@/hooks/use-platform-admin";
import type { Organization } from "@/types/platform";

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
        description="Platform-wide registry for developers, brokerages, individual brokers, and POPWAM entities."
      />
      <div className="mb-4 flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Type
          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900"
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
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Status
          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900"
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
        <p className="text-sm text-zinc-500 sm:ml-auto">Filters are local placeholders for Slice 2.</p>
      </div>
      {isLoading ? <LoadingState label="Loading organizations" /> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
      {!isLoading && !error ? (
        <DataTable<Organization>
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (row) => (
                <Link className="font-medium text-zinc-950 hover:underline" href={`/platform/organizations/${row.id}`}>
                  {row.name}
                </Link>
              ),
            },
            { key: "type", header: "Type" },
            { key: "status", header: "Status", cell: (row) => <OrganizationStatusBadge status={row.status} /> },
            { key: "plan", header: "Plan", cell: (row) => row.plan ?? "Not set" },
            {
              key: "location",
              header: "City / Country",
              cell: (row) => [row.city, row.country].filter(Boolean).join(", ") || "Not set",
            },
          ]}
          data={rows}
          emptyTitle="No organizations match these filters"
          emptyDescription="Change the local type or status filter to broaden the list."
        />
      ) : null}
    </>
  );
}
