import { notFound } from "next/navigation";

export default function HrReportsFeatureLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_ENABLE_HR_EXTENDED_FOUNDATIONS !== "true") notFound();
  return children;
}
