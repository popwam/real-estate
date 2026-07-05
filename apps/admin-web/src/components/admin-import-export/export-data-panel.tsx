"use client";

import { useMemo, useState } from "react";
import { DownloadJsonButton } from "@/components/admin-import-export/download-json-button";
import { JsonPreviewBlock } from "@/components/admin-import-export/json-preview-block";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import {
  useExportAccount,
  useExportCommissions,
  useExportDeals,
  useExportInventory,
  useExportProjects,
} from "@/hooks/use-admin-import-export";
import type { ExportDataType, ExportResponse } from "@/types/admin-import-export";
import { useI18n } from "@/i18n";

export function ExportDataPanel({ allowedTypes }: { allowedTypes?: ExportDataType[] }) {
  const { t } = useI18n();

  const [selected, setSelected] = useState<ExportDataType>(allowedTypes?.[0] ?? "projects");
  const [data, setData] = useState<ExportResponse | null>(null);
  const projects = useExportProjects();
  const inventory = useExportInventory();
  const deals = useExportDeals();
  const commissions = useExportCommissions();
  const account = useExportAccount();
  const options = allowedTypes ?? ["projects", "inventory", "deals", "commissions", "account"];
  const activeMutation = { projects, inventory, deals, commissions, account }[selected];
  const error = activeMutation.error;

  const fileName = useMemo(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    return `popwam-${selected}-export-${stamp}.json`;
  }, [selected]);

  async function runExport() {
    const result = await activeMutation.mutateAsync();
    setData(result);
  }

  return (
    <>
      <PageHeader title={t("adminSweep.data.export.61534a81")} description="Download backend-scoped JSON exports for review, demo, and compliance workflows." />
      <div className="space-y-6">
        <DetailCard title={t("adminSweep.choose.export.dc379970")}>
          <div className="grid gap-4 md:grid-cols-[260px_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900">{t("adminSweep.dataset.10526894")}</label>
              <select
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                value={selected}
                onChange={(event) => {
                  setSelected(event.target.value as ExportDataType);
                  setData(null);
                }}
              >
                {options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button disabled={activeMutation.isPending} onClick={runExport}>
                {activeMutation.isPending ? "Exporting" : "Run export"}
              </Button>
              <DownloadJsonButton data={data} disabled={!data} fileName={fileName} />
            </div>
          </div>
          {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          <p className="mt-4 text-sm text-zinc-600">{t("adminSweep.exports.are.json.only.in.this.slice.the.frontend.f4b61809")}</p>
        </DetailCard>
        <DetailCard title={t("adminSweep.json.preview.8eb99b41")}>
          <JsonPreviewBlock value={data ?? { message: "Run an export to preview JSON here." }} />
        </DetailCard>
      </div>
    </>
  );
}
