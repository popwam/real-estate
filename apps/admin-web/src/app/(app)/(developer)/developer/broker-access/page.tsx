"use client";

import { useState } from "react";
import { BrokerAccessLevelBadge } from "@/components/developer/badges";
import { BrokerAccessRuleForm } from "@/components/developer/broker-access-rule-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { useBrokerAccessRules, useCreateBrokerAccessRule, useDeleteBrokerAccessRule, useProjects, useUpdateBrokerAccessRule } from "@/hooks/use-developer";
import { formatPlainDate } from "@/lib/format";
import type { BrokerAccessLevel, BrokerAccessRule } from "@/types/developer";

export default function DeveloperBrokerAccessPage() {
  const { data: projects = [] } = useProjects();
  const { data = [], isLoading, error } = useBrokerAccessRules();
  const create = useCreateBrokerAccessRule();
  const update = useUpdateBrokerAccessRule();
  const remove = useDeleteBrokerAccessRule();
  const [level, setLevel] = useState<BrokerAccessLevel>("VIEW");

  return (
    <>
      <PageHeader title="Broker Access" description="Grant, update, and revoke project access for brokerages or selected brokers." />
      <div className="space-y-6">
        <DetailCard title="Create Access Rule">
          <BrokerAccessRuleForm projects={projects} isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="Access Rules">
          <div className="mb-4 flex items-center gap-2">
            <select className="h-9 rounded-md border border-zinc-300 px-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value as BrokerAccessLevel)}>
              <option value="VIEW">VIEW</option><option value="VIEW_PRICE">VIEW_PRICE</option><option value="FULL">FULL</option>
            </select>
            <span className="text-sm text-zinc-500">Selected update level for table actions.</span>
          </div>
          {isLoading ? <LoadingState label="Loading access rules" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<BrokerAccessRule>
              columns={[
                { key: "project", header: "Project", cell: (row) => row.project?.name ?? row.projectId },
                { key: "granteeType", header: "Grantee type" },
                { key: "granteeId", header: "Grantee id" },
                { key: "accessLevel", header: "Level", cell: (row) => <BrokerAccessLevelBadge accessLevel={row.accessLevel} /> },
                { key: "expiresAt", header: "Expires", cell: (row) => formatPlainDate(row.expiresAt) },
                { key: "actions", header: "Actions", cell: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button className="h-8 px-2" onClick={() => update.mutate({ id: row.id, input: { accessLevel: level } })}>Update</Button>
                    <Button className="h-8 bg-red-600 px-2 hover:bg-red-700" onClick={() => remove.mutate(row.id)}>Revoke</Button>
                  </div>
                ) },
              ]}
              data={data}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
