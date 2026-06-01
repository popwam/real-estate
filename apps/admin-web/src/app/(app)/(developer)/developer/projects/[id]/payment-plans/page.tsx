"use client";

import { useParams } from "next/navigation";
import { PaymentPlanForm } from "@/components/developer/payment-plan-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { DataTable } from "@/components/tables/data-table";
import { useCreatePaymentPlan, usePaymentPlans, useProject } from "@/hooks/use-developer";
import type { PaymentPlan } from "@/types/developer";

export default function ProjectPaymentPlansPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data = [], isLoading, error } = usePaymentPlans(id);
  const create = useCreatePaymentPlan(id);

  return (
    <>
      <PageHeader title={`${project?.name ?? "Project"} Payment Plans`} description="Create and review project or unit-scoped payment plans." />
      <div className="space-y-6">
        <DetailCard title="Create Payment Plan">
          <PaymentPlanForm isPending={create.isPending} error={create.error} onSubmit={(input) => create.mutateAsync(input)} />
        </DetailCard>
        <DetailCard title="Payment Plans">
          {isLoading ? <LoadingState label="Loading payment plans" /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <DataTable<PaymentPlan>
              columns={[
                { key: "name", header: "Name" },
                { key: "scope", header: "Scope" },
                { key: "downPaymentPct", header: "Down %" },
                { key: "installmentMonths", header: "Months" },
                { key: "installmentPct", header: "Installment %" },
                { key: "isActive", header: "Active", cell: (row) => row.isActive ? "Yes" : "No" },
              ]}
              data={data}
            />
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}
