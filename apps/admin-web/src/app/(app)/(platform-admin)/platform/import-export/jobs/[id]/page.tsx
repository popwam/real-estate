"use client";

import { useParams } from "next/navigation";
import { ImportJobDetailView } from "@/components/admin-import-export/import-job-detail-view";

export default function PlatformImportJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ImportJobDetailView id={id} jobsBasePath="/platform/import-export/jobs" />;
}
