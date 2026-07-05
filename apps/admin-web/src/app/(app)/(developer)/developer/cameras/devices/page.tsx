"use client";

import { OperationsPage } from "@/components/admin-operations/operations-page";
import { useI18n } from "@/i18n";

export default function DeveloperCameraDevicesPage() {
  const { t } = useI18n();

  return (
    <OperationsPage
      title={t("adminSweep.camera.devices.71fb8eb4")}
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
