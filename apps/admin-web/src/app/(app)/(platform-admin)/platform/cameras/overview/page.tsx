"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function PlatformCamerasOverviewPage() {
  return (
    <OperationsPage
      title="Cameras overview"
      description="Platform camera registry placeholder. No streams or credentials are exposed."
      listPath="/cameras/devices"
      queryKey="platform-cameras-overview"
      fields={[
        { name: "name", label: "Name" },
        { name: "provider", label: "Provider", type: "select", options: ["HIKVISION", "DAHUA", "GENERIC", "OTHER"] },
      ]}
      columns={["name", "organizationId", "provider", "status", "aiEnabled", "createdAt"]}
      note="No live stream, DVR connection, credentials, or AI analysis is active."
    />
  );
}
