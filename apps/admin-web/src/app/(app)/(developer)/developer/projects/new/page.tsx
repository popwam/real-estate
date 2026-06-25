"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDot, Package, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/developer/project-form";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateProject } from "@/hooks/use-developer";

export default function NewProjectPage() {
  const router = useRouter();
  const create = useCreateProject();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create a project"
        description="Build the project foundation now; inventory, payment plans, and selling access remain separate readiness steps."
        actions={<Link href="/developer/projects" className="ui-button ui-button-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to projects</Link>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <DetailCard title="Project setup">
          <ProjectForm
            submitLabel="Create project"
            isPending={create.isPending}
            error={create.error}
            onSubmit={async (input) => {
              const project = await create.mutateAsync(input);
              router.push(`/developer/projects/${project.id}`);
            }}
          />
        </DetailCard>
        <aside className="space-y-4" aria-label="Project creation guidance">
          <div className="ui-card p-5">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">What happens next</h2>
            <ol className="mt-4 space-y-4">
              <Step icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />} title="Create the record" description="Save supported project identity, location, and audience fields." />
              <Step icon={<Package className="h-4 w-4" aria-hidden="true" />} title="Add inventory" description="Create units and manage their prices, status, and visibility." />
              <Step icon={<Send className="h-4 w-4" aria-hidden="true" />} title="Prepare distribution" description="Review project visibility and broker selling permissions." />
            </ol>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]"><CircleDot className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />No autosave</div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">This form saves only when you select Create project. No unsupported draft or autosave behavior has been added.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">{icon}</span>
      <div><p className="text-sm font-semibold text-[var(--color-foreground)]">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{description}</p></div>
    </li>
  );
}
