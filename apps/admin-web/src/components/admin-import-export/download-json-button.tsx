"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function DownloadJsonButton({
  data,
  fileName,
  disabled,
}: {
  data: unknown;
  fileName: string;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button className="gap-2" disabled={disabled || data === undefined} onClick={download}>
      <Download className="h-4 w-4" aria-hidden="true" />{t("adminSweep.download.json.d296a30a")}</Button>
  );
}
