"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDot, Package, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/developer/project-form";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateProject } from "@/hooks/use-developer";
import { useI18n } from "@/i18n";

export default function NewProjectPage() {
  const { t } = useI18n();

  const router = useRouter();
  const create = useCreateProject();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("adminSweep.create.a.project.a469a595")}
        description="Build the project foundation now; inventory, payment plans, and selling access remain separate readiness steps."
        actions={<Link href="/developer/projects" className="ui-button ui-button-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("adminSweep.back.to.projects.0559813d")}</Link>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <DetailCard title={t("adminSweep.project.setup.a0e72cd3")}>
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
        <aside className="space-y-4" aria-label={t("adminSweep.project.creation.guidance.76d6079a")}>
          <div className="ui-card p-5">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{t("adminSweep.what.happens.next.51ecc5b2")}</h2>
            <ol className="mt-4 space-y-4">
              <Step icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />} title={t("adminSweep.create.the.record.5355b3c4")} description="Save supported project identity, location, and audience fields." />
              <Step icon={<Package className="h-4 w-4" aria-hidden="true" />} title={t("adminSweep.add.inventory.c5e4ed2f")} description="Create units and manage their prices, status, and visibility." />
              <Step icon={<Send className="h-4 w-4" aria-hidden="true" />} title={t("adminSweep.prepare.distribution.81f9490d")} description="Review project visibility and broker selling permissions." />
            </ol>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]"><CircleDot className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />{t("adminSweep.no.autosave.599d8af2")}</div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{t("adminSweep.this.form.saves.only.when.you.select.create.proj.460c0ab8")}</p>
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
