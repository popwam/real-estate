import { notFound } from "next/navigation";

export default function PlatformAdsFeatureLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_ENABLE_AD_PROVIDER_INTEGRATIONS !== "true") notFound();
  return children;
}
