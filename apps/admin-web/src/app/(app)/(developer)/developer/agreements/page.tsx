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
import { useI18n } from "@/i18n";

export default function DeveloperAgreementsPage() {
  const { t } = useI18n();

  const { data = [], isLoading, error } = useAgreements();
  const create = useCreateAgreement();
  const approve = useAgreementAction("approve");
  const suspend = useAgreementAction("suspend");
  const terminate = useAgreementAction("terminate");

  return (
    <>
      <PageHeader title={t("adminSweep.agreements.8fd739f0")} description="Developer-brokerage agreements and status actions." />
      <div className="space-y-6">
        <DetailCard title={t("adminSweep.create.agreement.proposal.ac1a546c")}>
          <AgreementForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title={t("adminSweep.agreements.8fd739f0")}>
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
                    <Button className="h-8 px-2" onClick={() => approve.mutate(row.id)}>{t("adminSweep.approve.7b2c7f14")}</Button>
                    <Button className="h-8 bg-amber-600 px-2 hover:bg-amber-700" onClick={() => suspend.mutate(row.id)}>{t("adminSweep.suspend.b24247fb")}</Button>
                    <Button className="h-8 bg-red-600 px-2 hover:bg-red-700" onClick={() => terminate.mutate(row.id)}>{t("adminSweep.terminate.77517bd0")}</Button>
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
