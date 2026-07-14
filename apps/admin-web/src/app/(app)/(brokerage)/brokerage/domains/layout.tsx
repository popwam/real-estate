import { notFound } from "next/navigation";

export default function BrokerageDomainsFeatureLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT !== "true") notFound();
  return children;
}
