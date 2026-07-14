import { notFound } from "next/navigation";

export default function PlatformCamerasFeatureLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_ENABLE_CAMERA_INTEGRATIONS !== "true") notFound();
  return children;
}
