"use client";

import { DomainStatusBadge } from "@/components/admin-public/badges";
import { DomainVerificationInstructions } from "@/components/admin-public/domain-verification-instructions";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { OrganizationDomain } from "@/types/admin-public";
import { useI18n } from "@/i18n";

export function OrganizationDomainsTable({
  domains,
  showDevActions,
  isWorking,
  onRequestVerification,
  onCheckDns,
  onTestDomain,
  onSetDefault,
  onDelete,
  onMarkVerifiedDevOnly,
}: {
  domains: OrganizationDomain[];
  showDevActions: boolean;
  isWorking?: boolean;
  onRequestVerification: (id: string) => void;
  onCheckDns: (id: string) => void;
  onTestDomain: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkVerifiedDevOnly: (id: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <DataTable<OrganizationDomain>
        columns={[
          { key: "status", header: t("companyDomains.status"), cell: (row) => <DomainStatusBadge status={row.status} /> },
          { key: "domain", header: t("companyDomains.domain"), cell: (row) => row.domain },
          { key: "isDefault", header: t("companyDomains.defaultDomain"), cell: (row) => row.isDefault ? t("common.yes") : t("common.no") },
          { key: "type", header: t("companyDomains.type"), cell: (row) => row.type.replace("_", " ") },
          { key: "lastCheckedAt", header: t("companyDomains.lastCheck"), cell: (row) => formatDate(row.lastCheckedAt) },
          { key: "statusNote", header: t("companyDomains.note"), cell: (row) => row.statusNote ?? t("common.none") },
          { key: "failureReason", header: t("companyDomains.failure"), cell: (row) => row.failureReason ?? t("common.none") },
          { key: "verifiedAt", header: t("companyDomains.verified"), cell: (row) => formatDate(row.verifiedAt) },
          {
            key: "actions",
            header: t("common.action"),
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button className="h-8 bg-white px-2 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" disabled={isWorking} onClick={() => onRequestVerification(row.id)}>{t("adminSweep.request.verification.176690d5")}</Button>
                <Button className="h-8 bg-white px-2 text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50" disabled={isWorking} onClick={() => onCheckDns(row.id)}>{t("adminSweep.check.dns.827a376c")}</Button>
                <Button className="h-8 bg-white px-2 text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50" disabled={isWorking} onClick={() => onTestDomain(row.id)}>{t("companyDomains.testDomain")}</Button>
                <Button className="h-8 bg-white px-2 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50" disabled={isWorking || row.isDefault} onClick={() => onSetDefault(row.id)}>{t("companyDomains.markDefault")}</Button>
                <Button className="h-8 bg-white px-2 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50" disabled={isWorking} onClick={() => onDelete(row.id)}>{t("common.delete")}</Button>
                {showDevActions ? (
                  <Button className="h-8 bg-white px-2 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50" disabled={isWorking} onClick={() => onMarkVerifiedDevOnly(row.id)}>{t("adminSweep.dev.verify.34b7baf1")}</Button>
                ) : null}
              </div>
            ),
          },
        ]}
        data={domains}
        emptyTitle={t("companyDomains.emptyTitle")}
        emptyDescription={t("companyDomains.emptyDescription")}
      />
      {domains.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {domains.map((domain) => (
            <DomainVerificationInstructions key={domain.id} domain={domain} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
