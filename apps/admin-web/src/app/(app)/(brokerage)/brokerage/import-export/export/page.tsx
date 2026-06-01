"use client";

import { ExportDataPanel } from "@/components/admin-import-export/export-data-panel";

export default function BrokerageExportPage() {
  return <ExportDataPanel allowedTypes={["projects", "inventory", "deals", "commissions", "account"]} />;
}
