"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectVisibilityBadge } from "@/components/developer/badges";
import { VisibilitySelector } from "@/components/developer/visibility-selector";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useProject, useUpdateProjectVisibility } from "@/hooks/use-developer";
import type { ProjectVisibility } from "@/types/developer";

export default function ProjectVisibilityPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error } = useProject(id);
  const update = useUpdateProjectVisibility();
  const [visibility, setVisibility] = useState<ProjectVisibility | undefined>();

  if (isLoading) return <LoadingState label="Loading visibility" />;
  if (error) return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p>;
  if (!project) return null;
  const selectedVisibility = visibility ?? project.visibility;

  return (
    <>
      <PageHeader title={`${project.name} Visibility`} description="Control marketplace exposure for this project." />
      <DetailCard title="Visibility">
        <div className="mb-5 flex items-center gap-3 text-sm">
          Current: <ProjectVisibilityBadge visibility={project.visibility} />
        </div>
        <VisibilitySelector value={selectedVisibility} onChange={setVisibility} />
        {update.error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{update.error.message}</p> : null}
        <Button className="mt-5" disabled={update.isPending} onClick={() => update.mutate({ id, visibility: selectedVisibility })}>
          {update.isPending ? "Updating" : "Update visibility"}
        </Button>
      </DetailCard>
    </>
  );
}
