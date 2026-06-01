"use client";

import { useParams } from "next/navigation";
import { OperationsDetailPage } from "@/components/admin-operations/operations-detail-page";

export default function CameraDeviceDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <OperationsDetailPage
      title="Camera device detail"
      description="Camera registry detail. No live stream, DVR connection, credentials, or AI analysis is active."
      path={`/cameras/devices/${id}`}
      queryKey={`camera-device-${id}`}
      activityPath={`/operations/activities/CAMERAS/CameraDevice/${id}`}
      fields={[
        { name: "name", label: "Name" },
        { name: "location", label: "Location" },
        { name: "provider", label: "Provider", type: "select", options: ["HIKVISION", "DAHUA", "GENERIC", "OTHER"] },
        { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"] },
      ]}
    />
  );
}
