"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Boxes, CreditCard, Eye, Layers, Package } from "lucide-react";
import { ProjectStatusBadge, ProjectVisibilityBadge } from "@/components/developer/badges";
import { ProjectForm } from "@/components/developer/project-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useProject, useUpdateProject } from "@/hooks/use-developer";
import { formatDate, formatPlainDate } from "@/lib/format";
import { ProjectSellingPermissions } from "@/components/developer/project-selling-permissions";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error } = useProject(id);
  const update = useUpdateProject();

  if (isLoading) return <LoadingState label="Loading project" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!project) return null;

  const links = [
    { href: `/developer/projects/${id}/phases`, label: "Phases", icon: Layers },
    { href: `/developer/projects/${id}/inventory`, label: "Inventory", icon: Package },
    { href: `/developer/projects/${id}/payment-plans`, label: "Payment plans", icon: CreditCard },
    { href: `/developer/projects/${id}/visibility`, label: "Visibility", icon: Eye },
  ];

  return (
    <>
      <PageHeader title={project.name} description="Project summary and editable basic fields." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DetailCard title="Summary">
            <DetailGrid items={[
              { label: "Status", value: <ProjectStatusBadge status={project.status} /> },
              { label: "Visibility", value: <ProjectVisibilityBadge visibility={project.visibility} /> },
              { label: "Type", value: project.type },
              { label: "Location", value: [project.city, project.district].filter(Boolean).join(", ") || "Not set" },
              { label: "Delivery", value: formatPlainDate(project.deliveryDate) },
              { label: "Created", value: formatDate(project.createdAt) },
            ]} />
          </DetailCard>
          <DetailCard title="Edit Basic Fields">
            <ProjectForm
              project={project}
              isPending={update.isPending}
              error={update.error}
              onSubmit={(input) => update.mutateAsync({ id, input })}
            />
          </DetailCard>
          <DetailCard title="Selling permissions">
            <ProjectSellingPermissions projectId={id} sellingMode={project.sellingMode} />
          </DetailCard>
        </div>
        <DetailCard title="Project Workflows">
          <div className="grid gap-3">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button className="w-full justify-start bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              <Boxes className="mb-2 h-4 w-4" />
              Inventory count: {project._count?.inventoryUnits ?? 0}
            </div>
          </div>
        </DetailCard>
      </div>
    </>
  );
}
