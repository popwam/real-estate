"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";
import { useI18n } from "@/i18n";

export default function AccountingTransactionDetailPage() {
  const { t } = useI18n();

  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title={t("adminSweep.accounting.transaction.detail.5429fe95")}
      description="Manual transaction detail. No payment gateway or ledger automation is included."
      path={`/accounting/transactions/${id}`}
      queryKey={`accounting-transaction-${id}`}
      activityPath={`/operations/activities/ACCOUNTING/AccountingTransaction/${id}`}
      fields={[
        { name: "type", label: "Type", type: "select", options: ["INCOME", "EXPENSE"] },
        { name: "amount", label: "Amount", type: "number" },
        { name: "currency", label: "Currency" },
        { name: "description", label: "Description" },
        { name: "occurredAt", label: "Occurred at", type: "date" },
      ]}
    />
  );
}
