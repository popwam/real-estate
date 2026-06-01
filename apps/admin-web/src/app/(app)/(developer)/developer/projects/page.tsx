"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ProjectStatusBadge, ProjectVisibilityBadge } from "@/components/developer/badges";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-developer";
import type { Project } from "@/types/developer";

export default function DeveloperProjectsPage() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const { data = [], isLoading, error } = useProjects(filters);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage developer-owned projects, visibility, phases, inventory, and payment plans."
        actions={<Link href="/developer/projects/new"><Button><Plus className="h-4 w-4" /> New project</Button></Link>}
      />
      <div className="mb-4 grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-4">
        {[
          ["status", ["", "DRAFT", "ACTIVE", "SOLD_OUT", "SUSPENDED", "ARCHIVED"]],
          ["visibility", ["", "PRIVATE", "APPROVED_BROKERAGES", "OPEN_MARKETPLACE", "SELECTED_BROKERS", "HIDDEN"]],
        ].map(([key, options]) => (
          <select key={key as string} className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={filters[key as string] ?? ""} onChange={(e) => setFilters((f) => ({ ...f, [key as string]: e.target.value || undefined }))}>
            {(options as string[]).map((o) => <option key={o || "all"} value={o}>{o || `All ${key}`}</option>)}
          </select>
        ))}
        <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" placeholder="City" value={filters.city ?? ""} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value || undefined }))} />
        <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" placeholder="District" value={filters.district ?? ""} onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value || undefined }))} />
      </div>
      {isLoading ? <LoadingState label="Loading projects" /> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
      {!isLoading && !error ? (
        <DataTable<Project>
          columns={[
            { key: "name", header: "Project", cell: (row) => <Link className="font-medium hover:underline" href={`/developer/projects/${row.id}`}>{row.name}</Link> },
            { key: "type", header: "Type" },
            { key: "location", header: "Location", cell: (row) => [row.city, row.district].filter(Boolean).join(", ") || "Not set" },
            { key: "status", header: "Status", cell: (row) => <ProjectStatusBadge status={row.status} /> },
            { key: "visibility", header: "Visibility", cell: (row) => <ProjectVisibilityBadge visibility={row.visibility} /> },
            { key: "units", header: "Units", cell: (row) => row._count?.inventoryUnits ?? 0 },
          ]}
          data={data}
        />
      ) : null}
    </>
  );
}
