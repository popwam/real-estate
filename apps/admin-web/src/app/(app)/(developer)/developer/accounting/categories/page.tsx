"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperAccountingCategoriesPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.accounting.categories.738806a0")}
      description="Simple income and expense category foundation."
      listPath="/accounting/categories"
      queryKey="accounting-categories"
      fields={[
        { name: "name", label: "Name" },
        { name: "type", label: "Type", type: "select", options: ["INCOME", "EXPENSE"] },
      ]}
      columns={["name", "type", "isActive", "createdAt"]}
      detailBasePath="/developer/accounting/categories"
    />
  );
}
