"use client";

import Link from "next/link";
import { ImportPreviewForm } from "@/components/admin-import-export/import-preview-form";
import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/i18n";

export default function DeveloperImportExportPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        title={t("adminSweep.import.project.inventory.d287c8a0")}
        description="Preview CSV or parsed JSON spreadsheet rows before committing developer project and inventory data."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50" href="/developer/import-export/jobs">{t("adminSweep.job.history.888eaa84")}</Link>
            <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50" href="/developer/import-export/export">{t("adminSweep.exports.0e165379")}</Link>
          </div>
        }
      />
      <ImportPreviewForm jobsBasePath="/developer/import-export/jobs" />
    </>
  );
}
