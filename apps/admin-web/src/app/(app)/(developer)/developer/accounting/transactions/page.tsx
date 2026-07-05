"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperAccountingTransactionsPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.accounting.transactions.09b72e43")}
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
