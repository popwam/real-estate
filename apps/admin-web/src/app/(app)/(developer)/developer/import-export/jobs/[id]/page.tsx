"use client";

import { useParams } from "next/navigation";
import { ImportJobDetailView } from "@/components/admin-import-export/import-job-detail-view";

export default function DeveloperImportJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ImportJobDetailView id={id} jobsBasePath="/developer/import-export/jobs" />;
}
