"use client";

import Link from "next/link";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { OperationsActivityTimeline } from "@/components/admin-operations/operations-activity-timeline";
import { useOperationSummary } from "@/hooks/use-admin-operations";
import { useI18n } from "@/i18n";

const links = [
  { href: "/developer/hr/employees", label: "HR employees" },
  { href: "/developer/accounting/transactions", label: "Accounting transactions" },
  { href: "/developer/legal/documents", label: "Legal documents" },
  { href: "/developer/ads/campaigns", label: "Ads campaigns" },
  { href: "/developer/cameras/devices", label: "Camera devices" },
];

export function OperationsOverviewPage({ platform = false }: { platform?: boolean }) {
  const { t } = useI18n();

  const summary = useOperationSummary(platform ? "platform-operations-summary" : "operations-summary", "/operations/summary");
  const data = summary.data ?? {};

  return (
    <>
      <PageHeader title={t("adminSweep.operations.overview.77c5f57a")} description="Internal operations dashboard for HR, accounting, legal, ads, and camera foundations." />
      <div className="space-y-6">
        <DetailCard title={t("adminSweep.summary.cards.015ef995")}>
          {summary.isLoading ? <LoadingState label="Loading operations summary" /> : null}
          {summary.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{summary.error.message}</p> : null}
          {!summary.isLoading && !summary.error ? (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              <SummaryCard label="Active employees" value={nested(data, ["hr", "activeEmployees"])} />
              <SummaryCard label="Accounting net" value={nested(data, ["accounting", "net"])} />
              <SummaryCard label="Legal open cases" value={nested(data, ["legal", "casesByStatus", "OPEN"])} />
              <SummaryCard label="Active ads" value={nested(data, ["ads", "byStatus", "ACTIVE"])} />
              <SummaryCard label="Active cameras" value={nested(data, ["cameras", "byStatus", "ACTIVE"])} />
            </div>
          ) : null}
        </DetailCard>
        <DetailCard title={t("adminSweep.module.links.3243d3b8")}>
          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <Link className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50" href={platform ? link.href.replace("/developer", "/platform").replace("/employees", "/overview").replace("/transactions", "/overview").replace("/documents", "/overview").replace("/campaigns", "/overview").replace("/devices", "/overview") : link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </DetailCard>
        <DetailCard title={t("adminSweep.recent.operations.activity.2451ba4a")}>
          <OperationsActivityTimeline path="/operations/activities?page=1&pageSize=10" queryKey={platform ? "platform-operations-activity" : "operations-activity"} />
        </DetailCard>
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{String(value ?? 0)}</p>
    </div>
  );
}

function nested(value: Record<string, unknown>, keys: string[]) {
  let current: unknown = value;
  for (const key of keys) {
    if (!current || typeof current !== "object") return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? 0;
}
