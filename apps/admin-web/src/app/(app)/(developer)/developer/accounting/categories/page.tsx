"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function DeveloperAccountingCategoriesPage() {
  return (
    <OperationsPage
      title="Accounting categories"
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
