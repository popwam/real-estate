"use client";

import Link from "next/link";
import { ArrowLeft, Eye, LoaderCircle, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectVisibilityBadge } from "@/components/developer/badges";
import { VisibilitySelector, visibilityOptions } from "@/components/developer/visibility-selector";
import { FeedbackState } from "@/components/feedback-state";
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
  const [visibility, setVisibility] = useState<ProjectVisibility>();

  if (isLoading) return <LoadingState label="Loading project visibility" />;
  if (error) return <FeedbackState tone="error" title="Visibility could not be loaded" description={error.message} />;
  if (!project) return <FeedbackState tone="error" title="Project is unavailable" />;

  const selectedVisibility = visibility ?? project.visibility;
  const selectedMeta = visibilityOptions[selectedVisibility];
  const changed = selectedVisibility !== project.visibility;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} visibility`}
        description="Choose the project audience with a clear understanding of marketplace impact."
        actions={<Link href={`/developer/projects/${id}`} className="ui-button ui-button-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Project overview</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DetailCard title="Who can discover this project?">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
            <Eye className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
            Current saved visibility: <ProjectVisibilityBadge visibility={project.visibility} />
          </div>
          <VisibilitySelector value={selectedVisibility} onChange={(value) => { setVisibility(value); update.reset(); }} />
          {update.error ? <div className="mt-5"><FeedbackState tone="error" title="Visibility could not be updated" description={update.error.message} /></div> : null}
          {update.isSuccess ? <div className="mt-5"><FeedbackState tone="success" title="Project visibility updated" /></div> : null}
          <div className="mt-6 flex justify-end border-t border-[var(--color-border)] pt-5">
            <Button disabled={update.isPending || !changed} onClick={() => update.mutate({ id, visibility: selectedVisibility })}>
              {update.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {update.isPending ? "Updating…" : changed ? "Save visibility" : "Visibility unchanged"}
            </Button>
          </div>
        </DetailCard>

        <aside className="space-y-4" aria-label="Selected visibility impact">
          <div className="ui-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">Selected audience</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">{selectedMeta.title}</h2>
            <p className="mt-3 text-sm font-semibold text-[var(--color-foreground)]">{selectedMeta.audience}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{selectedMeta.description}</p>
          </div>
          {selectedMeta.caution ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-5 text-sm leading-6 text-[var(--color-warning)]"><strong className="block">Before saving</strong><span className="mt-1 block">{selectedMeta.caution}</span></div> : null}
        </aside>
      </div>
    </div>
  );
}
