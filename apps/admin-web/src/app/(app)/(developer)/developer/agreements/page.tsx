"use client";

import { AgreementStatusBadge } from "@/components/developer/badges";
import { AgreementForm } from "@/components/developer/agreement-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { useAgreementAction, useAgreements, useCreateAgreement } from "@/hooks/use-developer";
import { formatPlainDate } from "@/lib/format";
import type { DeveloperAgreement } from "@/types/developer";

export default function DeveloperAgreementsPage() {
  const { data = [], isLoading, error } = useAgreements();
  const create = useCreateAgreement();
  const approve = useAgreementAction("approve");
  const suspend = useAgreementAction("suspend");
  const terminate = useAgreementAction("terminate");

  return (
    <>
      <PageHeader title="Agreements" description="Developer-brokerage agreements and status actions." />
      <div className="space-y-6">
        <DetailCard title="Create Agreement Proposal">
          <AgreementForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="Agreements">
          {isLoading ? <LoadingState label="Loading agreements" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<DeveloperAgreement>
              columns={[
                { key: "brokerage", header: "Brokerage", cell: (row) => row.brokerage?.name ?? row.brokerageId },
                { key: "status", header: "Status", cell: (row) => <AgreementStatusBadge status={row.status} /> },
                { key: "expiresAt", header: "Expires", cell: (row) => formatPlainDate(row.expiresAt) },
                { key: "actions", header: "Actions", cell: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button className="h-8 px-2" onClick={() => approve.mutate(row.id)}>Approve</Button>
                    <Button className="h-8 bg-amber-600 px-2 hover:bg-amber-700" onClick={() => suspend.mutate(row.id)}>Suspend</Button>
                    <Button className="h-8 bg-red-600 px-2 hover:bg-red-700" onClick={() => terminate.mutate(row.id)}>Terminate</Button>
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
