"use client";

import Link from "next/link";
import { ImportPreviewForm } from "@/components/admin-import-export/import-preview-form";
import { PageHeader } from "@/components/layout/page-header";

export default function DeveloperImportExportPage() {
  return (
    <>
      <PageHeader
        title="Import project inventory"
        description="Preview CSV or parsed JSON spreadsheet rows before committing developer project and inventory data."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50" href="/developer/import-export/jobs">
              Job history
            </Link>
            <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50" href="/developer/import-export/export">
              Exports
            </Link>
          </div>
        }
      />
      <ImportPreviewForm jobsBasePath="/developer/import-export/jobs" />
    </>
  );
}
