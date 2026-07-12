"use client";

import { LoadingState } from "@/components/loading-state";
import { useI18n } from "@/i18n";

export default function Loading() {
  const { t } = useI18n();
  return <LoadingState fullscreen label={t("auth.checkingSession")} />;
}
