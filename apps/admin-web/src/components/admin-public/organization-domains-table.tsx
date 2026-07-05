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
  onMarkVerifiedDevOnly,
}: {
  domains: OrganizationDomain[];
  showDevActions: boolean;
  isWorking?: boolean;
  onRequestVerification: (id: string) => void;
  onCheckDns: (id: string) => void;
  onMarkVerifiedDevOnly: (id: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <DataTable<OrganizationDomain>
        columns={[
          { key: "status", header: "Status", cell: (row) => <DomainStatusBadge status={row.status} /> },
          { key: "domain", header: "Domain", cell: (row) => row.domain },
          { key: "type", header: "Type", cell: (row) => row.type.replace("_", " ") },
          { key: "lastCheckedAt", header: "Last check", cell: (row) => formatDate(row.lastCheckedAt) },
          { key: "statusNote", header: "Note", cell: (row) => row.statusNote ?? "None" },
          { key: "failureReason", header: "Failure", cell: (row) => row.failureReason ?? "None" },
          { key: "verifiedAt", header: "Verified", cell: (row) => formatDate(row.verifiedAt) },
          {
            key: "actions",
            header: "Actions",
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button className="h-8 bg-white px-2 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" disabled={isWorking} onClick={() => onRequestVerification(row.id)}>{t("adminSweep.request.verification.176690d5")}</Button>
                <Button className="h-8 bg-white px-2 text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50" disabled={isWorking} onClick={() => onCheckDns(row.id)}>{t("adminSweep.check.dns.827a376c")}</Button>
                {showDevActions ? (
                  <Button className="h-8 bg-white px-2 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50" disabled={isWorking} onClick={() => onMarkVerifiedDevOnly(row.id)}>{t("adminSweep.dev.verify.34b7baf1")}</Button>
                ) : null}
              </div>
            ),
          },
        ]}
        data={domains}
        emptyTitle="No domains yet"
        emptyDescription="Add a custom domain or POPWAM subdomain to begin verification."
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
