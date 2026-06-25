"use client";

import { useState } from "react";
import { CommissionRuleForm } from "@/components/commercial/commission-rule-form";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCommissionRules, useCreateCommissionRule, useUpdateCommissionRule } from "@/hooks/use-commercial";
import type { CommissionRule } from "@/types/commercial";

export function CommissionRulesPageContent() {
  const [editing, setEditing] = useState<CommissionRule | undefined>();
  const { data = [], isLoading, error } = useCommissionRules();
  const create = useCreateCommissionRule();
  const update = useUpdateCommissionRule();

  return (
    <>
      <PageHeader title="Commission Rules" description="Define which party receives a percentage or fixed amount when an eligible deal is finalized." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <DetailCard title="Existing rules">
          {isLoading ? <LoadingState label="Loading commission rules" /> : null}
          {error ? <FeedbackState tone="error" title="Commission rules could not be loaded" description={error.message} /> : null}
          {!isLoading && !error && !data.length ? <div className="ui-empty-state"><h3>No commission rules</h3><p>Create the first scoped rule before finalizing eligible deals.</p></div> : null}
          {!isLoading && !error && data.length ? <div className="grid gap-3">{data.map((rule) => <article key={rule.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-[var(--color-text)]">{rule.project?.name ?? "Project rule"}</p><p className="mt-1 text-sm text-[var(--color-text-muted)]">{rule.partyType.toLowerCase()} · {rule.targetOrganization?.name ?? rule.targetUser?.email ?? "Default recipient for this scope"}</p></div><span className={`ui-badge ${rule.isActive ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : ""}`}>{rule.isActive ? "Active" : "Inactive"}</span></div><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-xs text-[var(--color-text-muted)]">Calculation</p><p className="font-semibold text-[var(--color-text)]">{rule.value}{rule.commissionType === "FIXED" ? ` ${rule.currency}` : "%"} <span className="font-normal text-[var(--color-text-muted)]">{rule.commissionType.toLowerCase()}</span></p></div><Button className="ui-button-secondary" onClick={() => setEditing(rule)}>Edit rule</Button></div></article>)}</div> : null}
        </DetailCard>
        <DetailCard title={editing ? "Edit commission rule" : "Create commission rule"} actions={editing ? <Button className="ui-button-secondary" onClick={() => setEditing(undefined)}>New rule</Button> : null}>
          <CommissionRuleForm
            rule={editing}
            isPending={create.isPending || update.isPending}
            error={create.error ?? update.error}
            onSubmit={(input) => editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input)}
          />
        </DetailCard>
      </div>
    </>
  );
}
