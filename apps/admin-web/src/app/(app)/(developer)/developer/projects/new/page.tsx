"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { ProjectForm } from "@/components/developer/project-form";
import { useCreateProject } from "@/hooks/use-developer";

export default function NewProjectPage() {
  const router = useRouter();
  const create = useCreateProject();
  return (
    <>
      <PageHeader title="New Project" description="Create a developer project record." />
      <DetailCard title="Project details">
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
    </>
  );
}
