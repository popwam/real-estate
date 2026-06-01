"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function AccountingCategoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="Accounting category detail"
      description="Income/expense category detail."
      path={`/accounting/categories/${id}`}
      queryKey={`accounting-category-${id}`}
      activityPath={`/operations/activities/ACCOUNTING/AccountingCategory/${id}`}
      fields={[
        { name: "name", label: "Name" },
        { name: "type", label: "Type", type: "select", options: ["INCOME", "EXPENSE"] },
      ]}
    />
  );
}
