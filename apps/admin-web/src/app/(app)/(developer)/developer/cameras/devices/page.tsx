"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";

export default function DeveloperCameraDevicesPage() {
  return (
    <OperationsPage
      title="Camera devices"
      description="Camera registry placeholder only. No streaming, DVR, credentials, or AI analysis are connected."
      listPath="/cameras/devices"
      queryKey="camera-devices"
      fields={[
        { name: "name", label: "Name" },
        { name: "location", label: "Location" },
        { name: "provider", label: "Provider", type: "select", options: ["HIKVISION", "DAHUA", "GENERIC", "OTHER"] },
        { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"] },
      ]}
      columns={["name", "location", "provider", "status", "aiEnabled", "createdAt"]}
      detailBasePath="/developer/cameras/devices"
      note="No live stream, DVR connection, credentials, or AI analysis is active."
    />
  );
}
