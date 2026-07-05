"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PaymentPlanForm } from "@/components/developer/payment-plan-form";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { StatusBadge } from "@/components/status-badge";
import { useCreatePaymentPlan, usePaymentPlans, useProject } from "@/hooks/use-developer";
import { useI18n } from "@/i18n";

export default function ProjectPaymentPlansPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();
  const project = useProject(id);
  const plans = usePaymentPlans(id);
  const create = useCreatePaymentPlan(id);
  const [formOpen, setFormOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader title={`${project.data?.name ?? "Project"} payment plans`} description="Keep project-wide offers separate from plans that target a specific unit." actions={<div className="flex flex-wrap gap-2"><Link href={`/developer/projects/${id}`} className="ui-button ui-button-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("adminSweep.project.overview.d4ae1b1a")}</Link><button type="button" className="ui-button ui-button-primary" onClick={() => setFormOpen((open) => !open)}><Plus className="h-4 w-4" aria-hidden="true" />{t("adminSweep.new.plan.06a18c99")}</button></div>} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ScopeCard title={t("adminSweep.project.level.plan.57581079")} description="Applies as a general commercial option for the project and does not require a unit ID." />
        <ScopeCard title={t("adminSweep.unit.level.plan.8f3201f5")} description="Targets one existing unit. The unit ID remains part of the existing payment-plan payload." />
      </div>

      {formOpen ? <DetailCard title={t("adminSweep.create.payment.plan.3e7e57af")}><PaymentPlanForm key={formVersion} isPending={create.isPending} error={create.error} onSubmit={async (input) => { await create.mutateAsync(input); setFormVersion((value) => value + 1); setFormOpen(false); }} /></DetailCard> : null}

      {plans.isLoading ? <LoadingState label="Loading payment plans" /> : null}
      {plans.error ? <FeedbackState tone="error" title={t("adminSweep.payment.plans.could.not.be.loaded.e57d2e09")} description={plans.error.message} /> : null}
      {create.isSuccess && !formOpen ? <FeedbackState tone="success" title={t("adminSweep.payment.plan.created.532cb951")} /> : null}
      {!plans.isLoading && !plans.error ? (
        <section aria-labelledby="payment-plans-title">
          <div className="mb-4"><h2 id="payment-plans-title" className="text-lg font-semibold text-[var(--color-foreground)]">{t("adminSweep.saved.plans.5ef2b528")}</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{(plans.data ?? []).length.toLocaleString()} {(plans.data ?? []).length === 1 ? "plan" : "plans"}</p></div>
          {(plans.data ?? []).length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(plans.data ?? []).map((plan) => (
                <article key={plan.id} className="ui-card p-5">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">{plan.scope === "PROJECT" ? "Project level" : "Unit level"}</p><h3 className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">{plan.name}</h3></div><StatusBadge status={plan.isActive ? "ACTIVE" : "INACTIVE"} /></div>
                  {plan.scope === "UNIT" ? <p className="mt-3 text-xs text-[var(--color-muted)]">{t("adminSweep.unit.da43633a")}{plan.unit?.unitNumber ?? plan.unitId ?? "Not specified"}</p> : null}
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><PlanFact label="Down payment" value={formatPercent(plan.downPaymentPct)} /><PlanFact label="Installments" value={plan.installmentMonths ? `${plan.installmentMonths} months` : "Not set"} /><PlanFact label="Installment share" value={formatPercent(plan.installmentPct)} /><PlanFact label="On delivery" value={formatPercent(plan.onDeliveryPct)} /><PlanFact label="Maintenance" value={plan.maintenanceFee != null ? String(plan.maintenanceFee) : "Not set"} /></dl>
                </article>
              ))}
            </div>
          ) : <EmptyState icon={<CreditCard className="h-5 w-5" aria-hidden="true" />} title={t("adminSweep.no.payment.plans.yet.f1e455e8")} description="Create a project-level plan or target a supported unit using the existing payment-plan fields." action={<button type="button" className="ui-button ui-button-primary" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />{t("adminSweep.create.first.plan.40b61062")}</button>} />}
        </section>
      ) : null}
    </div>
  );
}

function ScopeCard({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"><h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2><p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p></div>;
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"><dt className="text-xs text-[var(--color-muted)]">{label}</dt><dd className="mt-1 font-semibold text-[var(--color-foreground)]">{value}</dd></div>;
}

function formatPercent(value?: string | number | null) {
  return value == null || value === "" ? "Not set" : `${value}%`;
}
