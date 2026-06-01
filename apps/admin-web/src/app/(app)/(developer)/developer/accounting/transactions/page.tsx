"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function DeveloperAccountingTransactionsPage() {
  return (
    <OperationsPage
      title="Accounting transactions"
      description="Manual income and expense tracking. No payment gateway or ledger settlement is included."
      listPath="/accounting/transactions"
      queryKey="accounting-transactions"
      fields={[
        { name: "type", label: "Type", type: "select", options: ["INCOME", "EXPENSE"] },
        { name: "amount", label: "Amount", type: "number" },
        { name: "currency", label: "Currency" },
        { name: "description", label: "Description" },
        { name: "occurredAt", label: "Occurred at", type: "date" },
      ]}
      columns={["type", "amount", "currency", "description", "occurredAt", "createdAt"]}
      detailBasePath="/developer/accounting/transactions"
    />
  );
}
