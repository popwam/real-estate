"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Boxes, CreditCard, Eye, KeyRound, Layers, MapPin, Package, Pencil } from "lucide-react";
import { ProjectStatusBadge, ProjectVisibilityBadge } from "@/components/developer/badges";
import { ProjectForm } from "@/components/developer/project-form";
import { ProjectSellingPermissions } from "@/components/developer/project-selling-permissions";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { ProjectReadinessCard } from "@/components/projects/project-readiness-card";
import { useProject, useUpdateProject } from "@/hooks/use-developer";
import { formatDate, formatPlainDate } from "@/lib/format";
import { useI18n } from "@/i18n";

export default function ProjectDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error } = useProject(id);
  const update = useUpdateProject();

  if (isLoading) return <LoadingState label="Loading project command center" />;
  if (error) return <FeedbackState tone="error" title={t("adminSweep.project.could.not.be.loaded.889f976e")} description={error.message} />;
  if (!project) return <FeedbackState tone="error" title={t("adminSweep.project.is.unavailable.162dcb77")} description="The project response did not include a record." />;

  const location = [project.city, project.district].filter(Boolean).join(", ");
  const inventoryCount = project._count?.inventoryUnits;
  const paymentPlanCount = project.paymentPlans?.length;
  const locationReady = Boolean(project.city && project.district);

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description="Project command center for identity, readiness, distribution, and commercial setup."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/developer/projects/${id}/inventory`} className="ui-button ui-button-primary"><Package className="h-4 w-4" aria-hidden="true" />{t("adminSweep.inventory.300d29fd")}</Link>
            <Link href={`/developer/projects/${id}/visibility`} className="ui-button ui-button-secondary"><Eye className="h-4 w-4" aria-hidden="true" />{t("adminSweep.visibility.7d9ff4f0")}</Link>
          </div>
        }
      />

      <section className="ui-card overflow-hidden" aria-labelledby="project-overview-title">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">{formatLabel(project.type)}</p>
            <h2 id="project-overview-title" className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">{t("adminSweep.overview.0efc2e6b")}</h2>
          </div>
          <div className="flex flex-wrap gap-2"><ProjectStatusBadge status={project.status} /><ProjectVisibilityBadge visibility={project.visibility} /></div>
        </div>
        <div className="p-5">
          <DetailGrid items={[
            { label: "Location", value: location || "Not completed" },
            { label: "Address", value: project.address || "Not set" },
            { label: "Delivery", value: formatPlainDate(project.deliveryDate) },
            { label: "Selling mode", value: formatLabel(project.sellingMode) },
            { label: "Created", value: formatDate(project.createdAt) },
            { label: "Updated", value: formatDate(project.updatedAt) },
          ]} />
          <p className="mt-5 border-t border-[var(--color-border)] pt-5 text-sm leading-6 text-[var(--color-muted)]">{project.description || "No project description has been added yet."}</p>
        </div>
      </section>

      <section aria-labelledby="readiness-title">
        <div className="mb-4"><h2 id="readiness-title" className="text-lg font-semibold text-[var(--color-foreground)]">{t("adminSweep.readiness.6dc1222c")}</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{t("adminSweep.use.available.project.facts.to.identify.the.next.0a171f64")}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ProjectReadinessCard title={t("adminSweep.identity.and.location.2f6b0b79")} value={location || "Location incomplete"} description={locationReady ? "City and district are available for project context." : "Add both city and district for a clearer public and sales context."} ready={locationReady} href="#edit-project" actionLabel="Edit details" icon={<MapPin className="h-5 w-5" aria-hidden="true" />} />
          <ProjectReadinessCard title={t("adminSweep.inventory.300d29fd")} value={typeof inventoryCount === "number" ? `${inventoryCount} units` : "Review inventory"} description={typeof inventoryCount === "number" ? (inventoryCount > 0 ? "Units exist for this project." : "Add units with status, visibility, and pricing.") : "Open inventory to review the current unit set."} ready={typeof inventoryCount === "number" ? inventoryCount > 0 : undefined} href={`/developer/projects/${id}/inventory`} actionLabel="Open inventory" icon={<Boxes className="h-5 w-5" aria-hidden="true" />} />
          <ProjectReadinessCard title={t("adminSweep.public.visibility.ac1cbda5")} value={formatLabel(project.visibility)} description="Review exactly who can discover this project before changing exposure." ready={project.visibility === "OPEN_MARKETPLACE" || project.visibility === "APPROVED_BROKERAGES"} href={`/developer/projects/${id}/visibility`} actionLabel="Review visibility" icon={<Eye className="h-5 w-5" aria-hidden="true" />} />
          <ProjectReadinessCard title={t("adminSweep.selling.permissions.fd7729ab")} value={formatLabel(project.sellingMode)} description="Control whether sales remain owner-only or accept eligible broker attribution." href="#selling-permissions" actionLabel="Review selling access" icon={<KeyRound className="h-5 w-5" aria-hidden="true" />} />
          <ProjectReadinessCard title={t("adminSweep.payment.plans.9d8577f7")} value={typeof paymentPlanCount === "number" ? `${paymentPlanCount} plans` : "Review plans"} description="Plans can apply to the project or a specific unit." ready={typeof paymentPlanCount === "number" ? paymentPlanCount > 0 : undefined} href={`/developer/projects/${id}/payment-plans`} actionLabel="Open payment plans" icon={<CreditCard className="h-5 w-5" aria-hidden="true" />} />
        </div>
      </section>

      <section aria-labelledby="workflow-title">
        <div className="mb-4"><h2 id="workflow-title" className="text-lg font-semibold text-[var(--color-foreground)]">{t("adminSweep.project.workflows.7d5c9c7d")}</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{t("adminSweep.open.focused.workspaces.instead.of.crowding.ever.b988ad5c")}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <WorkflowLink href={`/developer/projects/${id}/phases`} label="Phases" description="Delivery stages and unit expectations." icon={<Layers className="h-5 w-5" aria-hidden="true" />} />
          <WorkflowLink href={`/developer/projects/${id}/inventory`} label="Inventory" description="Units, prices, status, and exposure." icon={<Package className="h-5 w-5" aria-hidden="true" />} />
          <WorkflowLink href={`/developer/projects/${id}/payment-plans`} label="Payment plans" description="Project- and unit-level structures." icon={<CreditCard className="h-5 w-5" aria-hidden="true" />} />
          <WorkflowLink href={`/developer/projects/${id}/visibility`} label="Visibility" description="Audience and marketplace exposure." icon={<Eye className="h-5 w-5" aria-hidden="true" />} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.65fr)]">
        <div id="edit-project">
          <DetailCard title={t("adminSweep.edit.project.details.189013d4")} actions={<Pencil className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />}>
            <ProjectForm project={project} isPending={update.isPending} error={update.error} successMessage={update.isSuccess ? "Project changes saved" : undefined} onSubmit={(input) => update.mutateAsync({ id, input })} />
          </DetailCard>
        </div>
        <div id="selling-permissions">
          <DetailCard title={t("adminSweep.selling.permissions.fd7729ab")}>
            <ProjectSellingPermissions projectId={id} sellingMode={project.sellingMode} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

function WorkflowLink({ href, label, description, icon }: { href: string; label: string; description: string; icon: React.ReactNode }) {
  return <Link href={href} className="ui-card flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-md)]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">{icon}</span><span><span className="block text-sm font-semibold text-[var(--color-foreground)]">{label}</span><span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">{description}</span></span></Link>;
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
