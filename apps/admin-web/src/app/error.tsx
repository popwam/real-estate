"use client";

import { AppStatusPage } from "@/components/app-status-page";

export default function Error({ reset }: { reset: () => void }) {
  return <AppStatusPage kind="500" reset={reset} />;
}
