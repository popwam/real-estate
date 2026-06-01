"use client";

import { useState } from "react";
import { CommissionRuleForm } from "@/components/commercial/commission-rule-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
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
      <PageHeader title="Commission Rules" description="Developer-managed commission rules. Use raw IDs where picker endpoints are not available." />
      <div className="space-y-6">
        <DetailCard title={editing ? "Edit Commission Rule" : "Create Commission Rule"} actions={editing ? <Button className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => setEditing(undefined)}>New rule</Button> : null}>
          <CommissionRuleForm
            rule={editing}
            isPending={create.isPending || update.isPending}
            error={create.error ?? update.error}
            onSubmit={(input) => editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input)}
          />
        </DetailCard>
        <DetailCard title="Rules">
          {isLoading ? <LoadingState label="Loading commission rules" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<CommissionRule>
              columns={[
                { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
                { key: "partyType", header: "Party" },
                { key: "commissionType", header: "Type" },
                { key: "value", header: "Value", cell: (row) => `${row.value} ${row.commissionType === "FIXED" ? row.currency : "%"}` },
                { key: "target", header: "Target", cell: (row) => row.targetOrganization?.name ?? row.targetUser?.email ?? row.targetOrganizationId ?? row.targetUserId ?? "Default" },
                { key: "isActive", header: "Active", cell: (row) => row.isActive ? "Yes" : "No" },
                { key: "actions", header: "Actions", cell: (row) => <Button className="h-8 px-2" onClick={() => setEditing(row)}>Edit</Button> },
              ]}
              data={data}
              emptyTitle="No commission rules"
              emptyDescription="Create rules before finalizing deals to generate commission entries."
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
