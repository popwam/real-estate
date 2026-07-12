"use client";

import { PublicStatusPage } from "@/components/public-status-page";

export default function Error({ reset }: { reset: () => void }) {
  return <PublicStatusPage kind="500" reset={reset} />;
}
