"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function LegalCaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="Legal case detail"
      description="Legal case tracker detail."
      path={`/legal/cases/${id}`}
      queryKey={`legal-case-${id}`}
      activityPath={`/operations/activities/LEGAL/LegalCase/${id}`}
      fields={[
        { name: "title", label: "Title" },
        { name: "status", label: "Status", type: "select", options: ["OPEN", "CLOSED", "ON_HOLD"] },
        { name: "description", label: "Description" },
      ]}
    />
  );
}
