"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function AccountingCategoryDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.accounting.category.detail.71c5f08d")}
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
